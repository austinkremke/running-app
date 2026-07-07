export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievement_definitions: {
        Row: {
          category: string
          criteria_json: Json
          criteria_type: string
          description: string
          display_name: string
          icon: string
          id: string
          is_active: boolean
          is_hidden: boolean
          requires_achievement_id: string | null
          sort_order: number
          tier: string
          xp_reward: number
        }
        Insert: {
          category: string
          criteria_json?: Json
          criteria_type: string
          description?: string
          display_name: string
          icon?: string
          id: string
          is_active?: boolean
          is_hidden?: boolean
          requires_achievement_id?: string | null
          sort_order?: number
          tier?: string
          xp_reward?: number
        }
        Update: {
          category?: string
          criteria_json?: Json
          criteria_type?: string
          description?: string
          display_name?: string
          icon?: string
          id?: string
          is_active?: boolean
          is_hidden?: boolean
          requires_achievement_id?: string | null
          sort_order?: number
          tier?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "achievement_definitions_requires_achievement_id_fkey"
            columns: ["requires_achievement_id"]
            isOneToOne: false
            referencedRelation: "achievement_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_events: {
        Row: {
          event_type: string
          metadata_json: Json | null
          occurred_at: string
          user_id: string
        }
        Insert: {
          event_type: string
          metadata_json?: Json | null
          occurred_at?: string
          user_id: string
        }
        Update: {
          event_type?: string
          metadata_json?: Json | null
          occurred_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          created_at: string
          distance_meters: number
          duration_seconds: number
          ended_at: string | null
          external_id: string | null
          external_source: string | null
          id: string
          match_id: string | null
          polyline: Json
          source: string
          started_at: string
          summary_json: Json
          track_storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          distance_meters?: number
          duration_seconds?: number
          ended_at?: string | null
          external_id?: string | null
          external_source?: string | null
          id: string
          match_id?: string | null
          polyline?: Json
          source: string
          started_at: string
          summary_json?: Json
          track_storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          distance_meters?: number
          duration_seconds?: number
          ended_at?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          match_id?: string | null
          polyline?: Json
          source?: string
          started_at?: string
          summary_json?: Json
          track_storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_gates: {
        Row: {
          created_at: string
          display_name: string
          feature_id: string
          is_active: boolean
          min_level: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          feature_id: string
          is_active?: boolean
          min_level: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          feature_id?: string
          is_active?: boolean
          min_level?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      feed_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          activity_id: string | null
          audiences: string[]
          created_at: string
          description: string
          id: string
          location: string
          match_id: string | null
          photo_url: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          activity_id?: string | null
          audiences?: string[]
          created_at?: string
          description?: string
          id?: string
          location?: string
          match_id?: string | null
          photo_url?: string | null
          title?: string
          user_id?: string | null
        }
        Update: {
          activity_id?: string | null
          audiences?: string[]
          created_at?: string
          description?: string
          id?: string
          location?: string
          match_id?: string | null
          photo_url?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: true
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_reactions: {
        Row: {
          created_at: string
          post_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          reaction?: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          friend_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_user_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_user_id_fkey"
            columns: ["friend_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_activity_credits: {
        Row: {
          activity_id: string
          created_at: string
          match_id: string
          points_awarded: number
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          match_id: string
          points_awarded: number
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          match_id?: string
          points_awarded?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_activity_credits_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: true
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_activity_credits_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_activity_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          match_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          match_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          match_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_participants: {
        Row: {
          created_at: string
          id: string
          lineup_order: number | null
          match_id: string
          meta_json: Json
          points: number
          side: string
          team_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lineup_order?: number | null
          match_id: string
          meta_json?: Json
          points?: number
          side: string
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lineup_order?: number | null
          match_id?: string
          meta_json?: Json
          points?: number
          side?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_participants_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_queue: {
        Row: {
          competitive_rating: number
          created_at: string
          id: string
          kind: string
          match_id: string | null
          match_type_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          competitive_rating: number
          created_at?: string
          id?: string
          kind?: string
          match_id?: string | null
          match_type_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          competitive_rating?: number
          created_at?: string
          id?: string
          kind?: string
          match_id?: string | null
          match_type_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_queue_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_queue_match_type_id_fkey"
            columns: ["match_type_id"]
            isOneToOne: false
            referencedRelation: "match_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_types: {
        Row: {
          display_name: string
          duration_label: string
          id: string
          kind: string
          overview: string
          scoring_details: string
          sort_order: number
          win_condition: string
        }
        Insert: {
          display_name: string
          duration_label?: string
          id: string
          kind: string
          overview?: string
          scoring_details?: string
          sort_order?: number
          win_condition?: string
        }
        Update: {
          display_name?: string
          duration_label?: string
          id?: string
          kind?: string
          overview?: string
          scoring_details?: string
          sort_order?: number
          win_condition?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_team_id: string | null
          created_at: string
          ends_at: string
          home_team_id: string | null
          id: string
          kind: string
          match_type_id: string
          started_at: string
          state_json: Json
          status: string
          updated_at: string
        }
        Insert: {
          away_team_id?: string | null
          created_at?: string
          ends_at: string
          home_team_id?: string | null
          id?: string
          kind: string
          match_type_id: string
          started_at?: string
          state_json?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          away_team_id?: string | null
          created_at?: string
          ends_at?: string
          home_team_id?: string | null
          id?: string
          kind?: string
          match_type_id?: string
          started_at?: string
          state_json?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_match_type_id_fkey"
            columns: ["match_type_id"]
            isOneToOne: false
            referencedRelation: "match_types"
            referencedColumns: ["id"]
          },
        ]
      }
      player_progress: {
        Row: {
          last_award_date: string | null
          rolling_avg_pace_sec: number | null
          streak_days: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          last_award_date?: string | null
          rolling_avg_pace_sec?: number | null
          streak_days?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          last_award_date?: string | null
          rolling_avg_pace_sec?: number | null
          streak_days?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_rank: {
        Row: {
          competitive_rating: number
          season_losses: number
          season_wins: number
          updated_at: string
          user_id: string
        }
        Insert: {
          competitive_rating?: number
          season_losses?: number
          season_wins?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          competitive_rating?: number
          season_losses?: number
          season_wins?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_rank_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          onboarding_completed_at: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          onboarding_completed_at?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          onboarding_completed_at?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_tiers: {
        Row: {
          display_name: string
          icon: string
          id: string
          min_rating: number
          sort_order: number
          subtitle: string | null
        }
        Insert: {
          display_name: string
          icon: string
          id: string
          min_rating: number
          sort_order: number
          subtitle?: string | null
        }
        Update: {
          display_name?: string
          icon?: string
          id?: string
          min_rating?: number
          sort_order?: number
          subtitle?: string | null
        }
        Relationships: []
      }
      solo_match_challenges: {
        Row: {
          challenged_id: string
          challenger_id: string
          created_at: string
          expires_at: string
          id: string
          match_id: string | null
          match_type_id: string
          status: string
          updated_at: string
        }
        Insert: {
          challenged_id: string
          challenger_id: string
          created_at?: string
          expires_at?: string
          id?: string
          match_id?: string | null
          match_type_id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          challenged_id?: string
          challenger_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          match_id?: string | null
          match_type_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solo_match_challenges_challenged_id_fkey"
            columns: ["challenged_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solo_match_challenges_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solo_match_challenges_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solo_match_challenges_match_type_id_fkey"
            columns: ["match_type_id"]
            isOneToOne: false
            referencedRelation: "match_types"
            referencedColumns: ["id"]
          },
        ]
      }
      team_match_queue: {
        Row: {
          competitive_rating: number
          created_at: string
          enqueued_by: string | null
          id: string
          match_id: string | null
          match_type_id: string
          status: string
          team_id: string
          updated_at: string
        }
        Insert: {
          competitive_rating: number
          created_at?: string
          enqueued_by?: string | null
          id?: string
          match_id?: string | null
          match_type_id: string
          status?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          competitive_rating?: number
          created_at?: string
          enqueued_by?: string | null
          id?: string
          match_id?: string | null
          match_type_id?: string
          status?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_match_queue_enqueued_by_fkey"
            columns: ["enqueued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_match_queue_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_match_queue_match_type_id_fkey"
            columns: ["match_type_id"]
            isOneToOne: false
            referencedRelation: "match_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_match_queue_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_membership_requests: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          kind: string
          status: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          kind: string
          status?: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          kind?: string
          status?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_membership_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_membership_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_membership_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_rank: {
        Row: {
          competitive_rating: number
          created_at: string
          season_losses: number
          season_wins: number
          team_id: string
          updated_at: string
        }
        Insert: {
          competitive_rating?: number
          created_at?: string
          season_losses?: number
          season_wins?: number
          team_id: string
          updated_at?: string
        }
        Update: {
          competitive_rating?: number
          created_at?: string
          season_losses?: number
          season_wins?: number
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_rank_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          logo_accent: string
          logo_icon: string
          member_max: number
          motto: string
          name: string
          tag: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_accent?: string
          logo_icon?: string
          member_max?: number
          motto?: string
          name: string
          tag: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_accent?: string
          logo_icon?: string
          member_max?: number
          motto?: string
          name?: string
          tag?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          progress_snapshot_json: Json | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          progress_snapshot_json?: Json | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          progress_snapshot_json?: Json | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievement_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_ledger: {
        Row: {
          amount: number
          awarded_at: string
          breakdown_json: Json
          id: string
          source: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          awarded_at?: string
          breakdown_json?: Json
          id?: string
          source: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          awarded_at?: string
          breakdown_json?: Json
          id?: string
          source?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_solo_match_challenge: {
        Args: { p_challenge_id: string }
        Returns: Json
      }
      achievement_metric: {
        Args: { p_criteria: Json; p_criteria_type: string; p_user_id: string }
        Returns: number
      }
      activity_has_visible_feed_post: {
        Args: { p_activity_id: string }
        Returns: boolean
      }
      add_friend: { Args: { p_friend_user_id: string }; Returns: undefined }
      apply_elo_match_result: {
        Args: {
          p_k_factor?: number
          p_loser_user_id: string
          p_winner_user_id: string
        }
        Returns: Json
      }
      apply_elo_match_result_system: {
        Args: {
          p_k_factor?: number
          p_loser_user_id: string
          p_winner_user_id: string
        }
        Returns: Json
      }
      apply_team_elo_match_result_system: {
        Args: {
          p_k_factor?: number
          p_loser_team_id: string
          p_winner_team_id: string
        }
        Returns: Json
      }
      are_friends: {
        Args: { p_user_a: string; p_user_b: string }
        Returns: boolean
      }
      assert_feature_gate: {
        Args: { p_feature_id: string; p_user_id: string }
        Returns: undefined
      }
      award_run_xp: { Args: { p_activity_id: string }; Returns: Json }
      bootstrap_progression_from_local: {
        Args: {
          p_last_award_date?: string
          p_rolling_avg_pace_sec?: number
          p_streak_days?: number
          p_total_xp: number
        }
        Returns: Json
      }
      can_view_feed_post: { Args: { p_post_id: string }; Returns: boolean }
      can_view_match: { Args: { p_match_id: string }; Returns: boolean }
      cancel_solo_match_challenge: {
        Args: { p_challenge_id: string }
        Returns: Json
      }
      cancel_solo_matchmaking: { Args: never; Returns: Json }
      cancel_team_matchmaking: { Args: never; Returns: Json }
      cancel_team_membership_request: {
        Args: { p_request_id: string }
        Returns: Json
      }
      create_solo_match_for_users: {
        Args: {
          p_away_user_id: string
          p_home_user_id: string
          p_match_type_id?: string
        }
        Returns: string
      }
      create_team: {
        Args: {
          p_logo_accent?: string
          p_logo_icon?: string
          p_motto?: string
          p_name: string
          p_tag: string
        }
        Returns: Json
      }
      credit_match_activity: { Args: { p_activity_id: string }; Returns: Json }
      cumulative_xp_for_level: { Args: { p_level: number }; Returns: number }
      decline_solo_match_challenge: {
        Args: { p_challenge_id: string }
        Returns: Json
      }
      delete_activity: { Args: { p_activity_id: string }; Returns: Json }
      delete_own_account: { Args: never; Returns: undefined }
      demote_member: { Args: { p_user_id: string }; Returns: undefined }
      disband_team: { Args: never; Returns: undefined }
      elo_expected_score: {
        Args: { p_rating_a: number; p_rating_b: number }
        Returns: number
      }
      enqueue_solo_matchmaking: {
        Args: { p_match_type_id?: string }
        Returns: Json
      }
      enqueue_team_matchmaking: {
        Args: { p_match_type_id?: string }
        Returns: Json
      }
      enroll_team_roster: {
        Args: { p_match_id: string; p_side: string; p_team_id: string }
        Returns: undefined
      }
      evaluate_achievements: { Args: { p_user_id?: string }; Returns: Json }
      evaluate_achievements_system: {
        Args: { p_user_id: string }
        Returns: Json
      }
      expire_stale_solo_match_challenges: { Args: never; Returns: undefined }
      expire_stale_team_membership_requests: { Args: never; Returns: undefined }
      finalize_due_solo_matches_for_user: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      finalize_due_team_matches_for_user: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      finalize_solo_match: { Args: { p_match_id: string }; Returns: Json }
      finalize_team_match: { Args: { p_match_id: string }; Returns: Json }
      finalize_team_membership_join: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: undefined
      }
      forfeit_solo_match: { Args: { p_match_id: string }; Returns: Json }
      get_my_solo_match_completions: {
        Args: { p_limit?: number; p_user_id?: string }
        Returns: Json
      }
      get_my_team_match_completions: {
        Args: { p_limit?: number; p_user_id?: string }
        Returns: Json
      }
      get_solo_match_challenge_status: { Args: never; Returns: Json }
      get_solo_matchmaking_status: { Args: never; Returns: Json }
      get_team_matchmaking_status: { Args: never; Returns: Json }
      get_team_notifications: { Args: never; Returns: Json }
      get_team_overview: { Args: { p_team_id: string }; Returns: Json }
      grant_achievement: {
        Args: { p_achievement_id: string; p_user_id: string }
        Returns: Json
      }
      has_incoming_solo_match_challenge: {
        Args: { p_user_id?: string }
        Returns: boolean
      }
      has_team_notifications: { Args: never; Returns: boolean }
      invite_to_team: { Args: { p_user_id: string }; Returns: Json }
      is_match_participant: {
        Args: { p_match_id: string; p_user_id?: string }
        Returns: boolean
      }
      kick_member: { Args: { p_user_id: string }; Returns: undefined }
      level_from_total_xp: { Args: { p_total_xp: number }; Returns: number }
      list_top_teams: {
        Args: { p_limit?: number }
        Returns: {
          competitive_rating: number
          logo_accent: string
          logo_icon: string
          member_count: number
          member_max: number
          motto: string
          name: string
          season_losses: number
          season_wins: number
          tag: string
          team_id: string
          total_member_xp: number
        }[]
      }
      match_points_for_activity: {
        Args: { p_distance_meters: number; p_duration_seconds?: number }
        Returns: number
      }
      match_points_for_distance: {
        Args: { p_distance_meters: number }
        Returns: number
      }
      persist_solo_match_completions: {
        Args: { p_match_id: string; p_result: Json }
        Returns: undefined
      }
      promote_member: { Args: { p_user_id: string }; Returns: undefined }
      record_achievement_event: {
        Args: { p_event_type: string; p_metadata?: Json }
        Returns: Json
      }
      repair_solo_match_activity_credits: { Args: never; Returns: Json }
      request_to_join_team: { Args: { p_team_id: string }; Returns: Json }
      respond_to_join_request: {
        Args: { p_accept: boolean; p_request_id: string }
        Returns: Json
      }
      respond_to_team_invite: {
        Args: { p_accept: boolean; p_request_id: string }
        Returns: Json
      }
      send_solo_match_challenge: {
        Args: { p_challenged_user_id: string; p_match_type_id?: string }
        Returns: Json
      }
      solo_match_duration_interval: {
        Args: { p_match_type_id: string }
        Returns: string
      }
      team_active_match_id: { Args: { p_team_id: string }; Returns: string }
      team_has_active_match: { Args: { p_team_id: string }; Returns: boolean }
      team_min_roster_to_queue: { Args: never; Returns: number }
      team_role_for: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: string
      }
      transfer_leadership: { Args: { p_user_id: string }; Returns: undefined }
      try_pair_solo_queue: { Args: never; Returns: string }
      try_pair_team_queue: { Args: never; Returns: string }
      update_team: {
        Args: {
          p_logo_accent?: string
          p_logo_icon?: string
          p_motto?: string
          p_name?: string
          p_team_id: string
        }
        Returns: undefined
      }
      user_has_live_active_solo_match: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      user_is_waiting_in_solo_queue: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      user_meets_achievement: {
        Args: {
          p_definition: Database["public"]["Tables"]["achievement_definitions"]["Row"]
          p_user_id: string
        }
        Returns: boolean
      }
      user_owns_activity: { Args: { p_activity_id: string }; Returns: boolean }
      xp_for_level_up: { Args: { p_level: number }; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
