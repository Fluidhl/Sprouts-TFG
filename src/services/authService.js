import { supabase } from '../lib/supabaseClient';

// REGISTRO
export async function signUp(email, password, name) {
  console.log('Registrando con:', {
  email,
  password,
  metadata: { name },
});
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      user_metadata: {
        name: name.trim(), // <-- asegúrate de que es un string no vacío
      },
    },
  });

  if (error) throw error;
  return data;
}

// LOGIN
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signIn({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// LOGOUT
export async function logout() {
  await supabase.auth.signOut();
}
