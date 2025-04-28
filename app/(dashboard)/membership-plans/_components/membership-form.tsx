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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useActionState } from "react";
import createMembership from "../actions";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export function MembershipPlanForm() {
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      monthlyPrice: 0,
      threeMonthPrice: 0,
      sixMonthPrice: 0,
      annualPrice: 0,
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
              <FormLabel>Plan Name</FormLabel>
              <FormControl>
                <Input placeholder="Gold Membership" {...field} />
              </FormControl>
              <FormDescription>The name of this membership plan</FormDescription>
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
                <Textarea
                  placeholder="Includes all gym facilities and premium services" 
                  className="resize-none"
                  {...field} 
                />
              </FormControl>
              <FormDescription>Describe what members get with this plan</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Pricing Tiers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="monthlyPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Price</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="99.99" {...field} />
                    </FormControl>
                    <FormDescription>Price for monthly billing</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="threeMonthPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>3-Month Price</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="269.97" {...field} />
                    </FormControl>
                    <FormDescription>Price per month for quarterly billing</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sixMonthPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>6-Month Price</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="509.94" {...field} />
                    </FormControl>
                    <FormDescription>Price per month for 6-month billing</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="annualPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Price</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="899.88" {...field} />
                    </FormControl>
                    <FormDescription>Price per month for annual billing</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Features</FormLabel>
              <FormControl>
                <Input
                  placeholder="Gym access, Pool, Classes, Personal trainer"
                  onChange={(e) => {
                    const features = e.target.value
                      .split(",")
                      .map((f) => f.trim())
                      .filter((f) => f.length > 0);
                    field.onChange(features);
                  }}
                />
              </FormControl>
              <FormDescription>Enter features separated by commas</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <p aria-live="polite" className="text-sm text-muted-foreground">{state?.message}</p>
        {state?.errors &&
          Object.entries(state.errors).map(([field, messages]) => (
            <p key={field} className="text-sm text-destructive">
              {messages?.join(", ")}
            </p>
          ))}
          
        <Button disabled={pending} type="submit" className="w-full md:w-auto">
          Create Membership Plan
        </Button>
      </form>
    </Form>
  );
}