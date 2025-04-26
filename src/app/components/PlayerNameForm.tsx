'use client'

import { useState } from 'react'
import PageBackground from './PageBackground'
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useSession } from '../hooks/useSession'

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
})

interface PlayerNameFormProps {
  onSubmit: (name: string) => void;
}

export default function PlayerNameForm({ onSubmit }: PlayerNameFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  })
const session = useSession();
  function handleSubmit(values: z.infer<typeof formSchema>) {
  if (session) {
    localStorage.setItem('playerRatingsSession', JSON.stringify(session));
  } else {
    console.warn('No session available when submitting form');
  }
  onSubmit(values.name.trim())
}

  return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-4xl text-white">
            Welcome to Player Ratings Miami!
          </h1>
          <p className="text-gray-300">
            Please enter your name to continue
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What's your name?</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-green-500 text-white text-lg p-2 rounded hover:bg-green-600">
              Continue
            </Button>
          </form>
        </Form>
      </div>
  )
}