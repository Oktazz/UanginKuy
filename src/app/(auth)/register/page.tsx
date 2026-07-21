import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { signup } from "../login/actions"
import { Leaf } from "lucide-react"

export default function RegisterPage(props: {
  searchParams: { error?: string }
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-surface p-8 shadow-sm">
        
        {/* Header */}
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Daftar Akun Baru
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Bergabunglah dan mulai jadikan sampahmu bernilai
          </p>
        </div>

        {/* Error Message */}
        {props.searchParams?.error && (
          <div className="rounded-md bg-error/10 p-4">
            <p className="text-sm text-error text-center">{props.searchParams.error}</p>
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" action={signup}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Alamat Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Kata Sandi (Min. 6 Karakter)"
                minLength={6}
              />
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full">
              Daftar Sekarang
            </Button>
          </div>
        </form>
        
        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-dark hover:underline">
            Masuk
          </Link>
        </div>
      </div>
    </div>
  )
}
