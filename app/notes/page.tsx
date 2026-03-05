import { createClient } from "@/utils/supabase/server";

export default async function Notes() {
  const supabase = await createClient();

  const { data: notes, error } = await supabase
    .from("notes")
    .select("id, title")
    .order("id", { ascending: true });

  if (error) {
    return (
      <pre>
        {JSON.stringify(
          { message: "Failed to load notes", error: error.message },
          null,
          2
        )}
      </pre>
    );
  }

  return <pre>{JSON.stringify(notes, null, 2)}</pre>;
}
