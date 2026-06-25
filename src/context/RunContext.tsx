import * as Device from 'expo-device';
import { Platform } from 'react-native';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { MOCK_GPS } from '../maps/config';
import { activeLocationProvider } from '../maps/registry';
import type { GpsPoint } from '../maps/types';
import { recordsToGpsPoints } from '../services/activityAdapters';
import { livePaceLabel, totalDistanceMeters } from '../services/activityMetrics';
import { appendGpsRecord, createStartRecord } from '../services/activityRecorder';
import { buildPostRunSummary } from '../services/buildPostRunSummary';
import { syncActivityToServer } from '../services/activitySync';
import { formatDistanceMiles, formatDurationClock } from '../services/distanceService';
import { elapsedSeconds } from '../services/runMetrics';
import { markActivityPendingSync } from '../storage/activitySyncQueue';
import { saveActivity } from '../storage/activityStorage';
import { useAuth } from './AuthContext';
import type {
  ActivityRecord,
  ActivitySession,
  ActivitySource,
  FinishedActivity,
} from '../types/activity';

type RunContextValue = {
  isRecording: boolean;
  records: ActivityRecord[];
  routePoints: GpsPoint[];
  distanceMeters: number;
  elapsedSeconds: number;
  distanceLabel: string;
  durationLabel: string;
  paceLabel: string;
  lastFinishedRun: FinishedActivity | null;
  startRun: () => Promise<boolean>;
  stopRun: () => Promise<FinishedActivity | null>;
  clearLastFinishedRun: () => void;
};

const RunContext = createContext<RunContextValue | null>(null);

function newActivityId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const random = (Math.random() * 16) | 0;
    const value = c === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

async function detectActivitySource(): Promise<ActivitySource> {
  if (Platform.OS === 'web') return 'mock';
  if (Device.isDevice) return 'phone-gps';
  return MOCK_GPS ? 'mock' : 'phone-gps';
}

export function RunProvider({ children }: { children: React.ReactNode }) {
  const { session: authSession } = useAuth();
  const userId = authSession?.user?.id ?? null;
  const [session, setSession] = useState<ActivitySession | null>(null);
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [tick, setTick] = useState(0);
  const [lastFinishedRun, setLastFinishedRun] = useState<FinishedActivity | null>(null);
  const watcherRef = useRef<{ stop: () => void } | null>(null);
  const recordsRef = useRef<ActivityRecord[]>([]);
  const sessionRef = useRef<ActivitySession | null>(null);

  const isRecording = session?.status === 'recording';
  const routePoints = useMemo(() => recordsToGpsPoints(records), [records]);
  const distanceMeters = useMemo(() => totalDistanceMeters(records), [records]);
  const elapsed = useMemo(() => {
    if (!session?.startedAt) return 0;
    return elapsedSeconds(session.startedAt, session.pausedDurationMs);
  }, [session?.pausedDurationMs, session?.startedAt, tick]);

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (!isRecording) return undefined;

    const timer = setInterval(() => {
      setTick((value) => value + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording]);

  const startRun = useCallback(async () => {
    if (isRecording) return true;

    const granted = await activeLocationProvider.requestPermissions();
    if (!granted) return false;

    watcherRef.current?.stop();

    const startedAt = new Date().toISOString();
    const source = await detectActivitySource();
    const nextSession: ActivitySession = {
      id: newActivityId(),
      status: 'recording',
      startedAt,
      pausedDurationMs: 0,
      source,
    };

    const firstPoint = await activeLocationProvider.getCurrentPosition();
    const initialRecords = firstPoint ? [createStartRecord(firstPoint, startedAt, source)] : [];

    setSession(nextSession);
    sessionRef.current = nextSession;
    setRecords(initialRecords);
    recordsRef.current = initialRecords;

    watcherRef.current = await activeLocationProvider.watchPosition((point) => {
      const activeSession = sessionRef.current;
      if (!activeSession) return;

      setRecords((previous) => {
        const next = appendGpsRecord(previous, point, activeSession.startedAt, activeSession.source);
        if (!next) return previous;
        recordsRef.current = next;
        return next;
      });
    });

    return true;
  }, [isRecording]);

  const stopRun = useCallback(async () => {
    watcherRef.current?.stop();
    watcherRef.current = null;

    if (!session || session.status !== 'recording') {
      return null;
    }

    const endedAt = new Date().toISOString();
    const recorded = recordsRef.current;
    const completedSession: ActivitySession = {
      ...session,
      status: 'completed',
      endedAt,
    };
    const summary = buildPostRunSummary(completedSession, recorded, endedAt);
    const finished: FinishedActivity = {
      session: completedSession,
      records: recorded,
      summary,
    };

    await saveActivity(finished);

    if (userId) {
      const syncResult = await syncActivityToServer(finished, userId);
      if (!syncResult.ok) {
        console.warn('Activity sync failed; queued for retry.', syncResult.error);
      }
    } else {
      await markActivityPendingSync(finished.session.id);
    }

    setSession(null);
    sessionRef.current = null;
    setRecords([]);
    recordsRef.current = [];
    setLastFinishedRun(finished);
    return finished;
  }, [session, userId]);

  const clearLastFinishedRun = useCallback(() => {
    setLastFinishedRun(null);
  }, []);

  const value = useMemo(
    () => ({
      isRecording,
      records,
      routePoints,
      distanceMeters,
      elapsedSeconds: elapsed,
      distanceLabel: formatDistanceMiles(distanceMeters),
      durationLabel: formatDurationClock(elapsed),
      paceLabel: livePaceLabel(records),
      lastFinishedRun,
      startRun,
      stopRun,
      clearLastFinishedRun,
    }),
    [
      clearLastFinishedRun,
      distanceMeters,
      elapsed,
      isRecording,
      lastFinishedRun,
      records,
      routePoints,
      startRun,
      stopRun,
    ],
  );

  return <RunContext.Provider value={value}>{children}</RunContext.Provider>;
}

export function useRun() {
  const context = useContext(RunContext);
  if (!context) {
    throw new Error('useRun must be used within RunProvider');
  }
  return context;
}
