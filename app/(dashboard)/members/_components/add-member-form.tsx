"use client";

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
import { toast } from "sonner"

import { zodResolver } from "@hookform/resolvers/zod";
import { MembershipPlan } from "@prisma/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createMember } from "../actions";

// Update the form schema to include new fields
const formSchema = z.object({
  name: z.string({
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  idNumber: z.string({
    required_error: "ID Number is required.",
  }),
  // Address fields
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),

});

interface AddMemberFormProps {
  membershipPlans: (Omit<
    MembershipPlan,
    "price" | "createdAt" | "updatedAt"
  > & {
    price: string;
    createdAt: string;
    updatedAt: string;
  })[];
}

export function AddMemberForm({ }: AddMemberFormProps) {

    
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      idNumber: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('button reached')
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("email", values.email);
    if (values.phone) formData.append("phone", values.phone);
    formData.append("idNumber", values.idNumber);
    
    // Add address fields to form data
    if (values.addressLine1) formData.append("addressLine1", values.addressLine1);
    if (values.addressLine2) formData.append("addressLine2", values.addressLine2);
    if (values.city) formData.append("city", values.city);
    if (values.state) formData.append("state", values.state);
    if (values.postalCode) formData.append("postalCode", values.postalCode);
    if (values.country) formData.append("country", values.country);
   
    try {
        const result = await createMember({}, formData);
      console.log('result2',result)
      
      if (result.errors) {
        toast('Error')

        // Handle validation errors
        Object.entries(result.errors).forEach(([field, errors]) => {
          if (field in form.formState.errors) {
            form.setError(field as any, { 
              type: "manual", 
              message: errors[0] 
            });
          }
        });
      } else if (result.message) {
        // Success case
        toast(result.message)
        form.reset(); // Clear the form
        // You might want to add toast notification or redirect here
        console.log(result.message);
      }
    } catch (error) {
      console.error("Failed to create member:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john.doe@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="idNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID Number</FormLabel>
                <FormControl>
                  <Input placeholder="ID12345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border p-4 rounded-md">
          <h3 className="text-lg font-medium mb-4">Address Information</h3>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Apt 4B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="New York" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Province</FormLabel>
                  <FormControl>
                    <Input placeholder="NY" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal/ZIP Code</FormLabel>
                  <FormControl>
                    <Input placeholder="10001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="United States" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}