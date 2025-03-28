"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useActionState } from "react";
import createMembership from "../actions";

export function MembershipForm() {
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      billingCycle: "monthly",
      features: [],
      isActive: true,
    },
  });

  const initialMessage = {
    errors: undefined,
    error: undefined,
    message: "Please fill out the form to create a new membership plan",
  };

  const [state, formAction, pending] = useActionState(
    createMembership,
    initialMessage
  );

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Gold Membership" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Includes all facilities" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input type="number" placeholder="99.99" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="billingCycle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing Cycle</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Features</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter features separated by commas"
                  onChange={(e) => {
                    const features = e.target.value
                      .split(",")
                      .map((f) => f.trim())
                      .filter((f) => f.length > 0);
                    field.onChange(features);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <p aria-live="polite">{state?.message}</p>
        {state?.errors &&
          Object.entries(state.errors).map(([field, messages]) => (
            <p key={field} className="text-red-500">
              {messages?.join(", ")}
            </p>
          ))}
        <Button disabled={pending} type="submit">
          Create Membership
        </Button>
      </form>
    </Form>
  );
}
