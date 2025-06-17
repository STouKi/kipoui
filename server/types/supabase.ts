export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      chats: {
        Row: {
          created_at: string
          id: number
          profile_id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          profile_id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          profile_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'chats_profile_id_profiles_id_fk'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      goals: {
        Row: {
          deadline: string | null
          id: number
          profile_id: string | null
          target_weight: number | null
        }
        Insert: {
          deadline?: string | null
          id?: never
          profile_id?: string | null
          target_weight?: number | null
        }
        Update: {
          deadline?: string | null
          id?: never
          profile_id?: string | null
          target_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'goals_profile_id_profiles_id_fk'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      habits: {
        Row: {
          compulsive_habits: boolean
          diet: Database['public']['Enums']['diet'] | null
          id: number
          profile_id: string | null
          religious_regime:
            | Database['public']['Enums']['religious_regime']
            | null
          sport_week_frequency: number | null
        }
        Insert: {
          compulsive_habits?: boolean
          diet?: Database['public']['Enums']['diet'] | null
          id?: never
          profile_id?: string | null
          religious_regime?:
            | Database['public']['Enums']['religious_regime']
            | null
          sport_week_frequency?: number | null
        }
        Update: {
          compulsive_habits?: boolean
          diet?: Database['public']['Enums']['diet'] | null
          id?: never
          profile_id?: string | null
          religious_regime?:
            | Database['public']['Enums']['religious_regime']
            | null
          sport_week_frequency?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'habits_profile_id_profiles_id_fk'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      medical_data: {
        Row: {
          allergies: Database['public']['Enums']['allergy'][] | null
          eating_disorders:
            | Database['public']['Enums']['eating_disorders'][]
            | null
          id: number
          medical_regimen:
            | Database['public']['Enums']['medical_regimen'][]
            | null
          profile_id: string | null
        }
        Insert: {
          allergies?: Database['public']['Enums']['allergy'][] | null
          eating_disorders?:
            | Database['public']['Enums']['eating_disorders'][]
            | null
          id?: never
          medical_regimen?:
            | Database['public']['Enums']['medical_regimen'][]
            | null
          profile_id?: string | null
        }
        Update: {
          allergies?: Database['public']['Enums']['allergy'][] | null
          eating_disorders?:
            | Database['public']['Enums']['eating_disorders'][]
            | null
          id?: never
          medical_regimen?:
            | Database['public']['Enums']['medical_regimen'][]
            | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'medical_data_profile_id_profiles_id_fk'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      messages: {
        Row: {
          chat_id: number | null
          content: string | null
          created_at: string
          id: number
          role: Database['public']['Enums']['role'] | null
        }
        Insert: {
          chat_id?: number | null
          content?: string | null
          created_at?: string
          id?: never
          role?: Database['public']['Enums']['role'] | null
        }
        Update: {
          chat_id?: number | null
          content?: string | null
          created_at?: string
          id?: never
          role?: Database['public']['Enums']['role'] | null
        }
        Relationships: [
          {
            foreignKeyName: 'messages_chat_id_chats_id_fk'
            columns: ['chat_id']
            isOneToOne: false
            referencedRelation: 'chats'
            referencedColumns: ['id']
          }
        ]
      }
      physical_data: {
        Row: {
          birth_date: string | null
          gender: Database['public']['Enums']['gender'] | null
          height_cm: number | null
          id: number
          profile_id: string | null
          weight_kg: number | null
        }
        Insert: {
          birth_date?: string | null
          gender?: Database['public']['Enums']['gender'] | null
          height_cm?: number | null
          id?: never
          profile_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          birth_date?: string | null
          gender?: Database['public']['Enums']['gender'] | null
          height_cm?: number | null
          id?: never
          profile_id?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'physical_data_profile_id_profiles_id_fk'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      preferences: {
        Row: {
          dislikes: string[] | null
          id: number
          profile_id: string | null
        }
        Insert: {
          dislikes?: string[] | null
          id?: never
          profile_id?: string | null
        }
        Update: {
          dislikes?: string[] | null
          id?: never
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'preferences_profile_id_profiles_id_fk'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          profile_detail: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          profile_detail?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          profile_detail?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      allergy:
        | 'celery'
        | 'cereals_containing_gluten'
        | 'crustaceans'
        | 'eggs'
        | 'fish'
        | 'lupin'
        | 'milk'
        | 'molluscs'
        | 'mustard'
        | 'peanuts'
        | 'sesame_seeds'
        | 'soybeans'
        | 'sulphur_dioxide_and_sulphites'
        | 'tree_nuts'
      diet: 'vegan' | 'vegetarian' | 'pescatarian'
      eating_disorders: 'anorexia' | 'bulimia'
      gender: 'male' | 'female'
      medical_regimen: 'diabetes' | 'cholesterol' | 'hypertension' | 'crohn'
      religious_regime: 'halal' | 'kasher' | 'buddhist' | 'religious_fasting'
      role: 'user' | 'assistant'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
    Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
      ? R
      : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
    DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
      DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
        ? R
        : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Insert: infer I
  }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Update: infer U
  }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema['Enums']
  | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema['CompositeTypes']
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {}
  },
  public: {
    Enums: {
      allergy: [
        'celery',
        'cereals_containing_gluten',
        'crustaceans',
        'eggs',
        'fish',
        'lupin',
        'milk',
        'molluscs',
        'mustard',
        'peanuts',
        'sesame_seeds',
        'soybeans',
        'sulphur_dioxide_and_sulphites',
        'tree_nuts'
      ],
      diet: ['vegan', 'vegetarian', 'pescatarian'],
      eating_disorders: ['anorexia', 'bulimia'],
      gender: ['male', 'female'],
      medical_regimen: ['diabetes', 'cholesterol', 'hypertension', 'crohn'],
      religious_regime: ['halal', 'kasher', 'buddhist', 'religious_fasting'],
      role: ['user', 'assistant']
    }
  }
} as const
