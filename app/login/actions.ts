"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@/utils/supabase/server";

// Initialize Prisma client
// In a production app, you should use a singleton pattern
const prisma = new PrismaClient();

export async function login(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // Get all form data
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const phone = (formData.get("phone") as string) || null;

  // Validate form data
  if (!email || !password || !name) {
    // In production, you should return a more specific error
    redirect("/error?reason=missing_fields");
  }

  try {
    // First, create the Supabase auth user
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name, // Store name in Supabase user metadata
          phone,
        },
      },
    });

    if (error) {
      console.error("Supabase auth error:", error);
      redirect("/error");
    }

    if (authData.user) {
      await prisma.user.create({
        data: {
          id: authData.user.id, // Use Supabase user ID as Prisma user ID
          email,
          name,
          password: "supabase-managed", // Don't store actual password, it's managed by Supabase

          role: "MEMBER",
        },
      });
    }

    // Redirect to dashboard or welcome page
    revalidatePath("/", "layout");
    redirect("/welcome"); // Consider sending to a welcome page instead
  } catch (e) {
    console.error("Unexpected error during signup:", e);
    redirect("/error");
  }
}
