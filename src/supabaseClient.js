import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tpqznvpdckashuzydtsf.supabase.co";

const supabaseKey =
  "sb_publishable_GnkhfLQq4zszSv8T5vAkfA_OY4i0cNa";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
