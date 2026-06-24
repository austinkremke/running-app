import type { StoredActivity } from '../types/activity';

export type { StoredActivity, FinishedActivity } from '../types/activity';
export type { FinishedActivity as FinishedRun } from '../types/activity';

/** Future: parse Garmin FIT files into StoredActivity. */
export type FitImportOptions = {
  preferDeviceDistance?: boolean;
};

/** Future: fetch Strava activity + streams into StoredActivity. */
export type StravaImportOptions = {
  activityId: string;
  accessToken: string;
};

/** Future: export formats for upload to Garmin Connect / Strava. */
export type ActivityExportFormat = 'gpx' | 'tcx' | 'fit';

export type ActivityExportRequest = {
  activity: StoredActivity;
  format: ActivityExportFormat;
};

// Stubs — implement when OAuth / file IO is added.
export async function importFromFit(_fileUri: string, _options?: FitImportOptions): Promise<StoredActivity> {
  throw new Error('Garmin FIT import is not implemented yet.');
}

export async function importFromStrava(_options: StravaImportOptions): Promise<StoredActivity> {
  throw new Error('Strava import is not implemented yet.');
}

export async function exportActivity(_request: ActivityExportRequest): Promise<string> {
  throw new Error('Activity export is not implemented yet.');
}
