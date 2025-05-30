import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';

// Usa tus propias claves de tu proyecto Supabase
const supabaseUrl = 'https://jeopkmaqdllubjzgwabz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Implb3BrbWFxZGxsdWJqemd3YWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMzM4OTksImV4cCI6MjA2MzkwOTg5OX0.MhqpDI76yJV-XFeCIvj7xjKhlIuKAnLB1IKmn10pCZE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
