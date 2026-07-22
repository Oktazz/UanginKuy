import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { login } from "./actions"
import { Leaf } from "lucide-react"

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-surface p-8 shadow-sm">
        
        {/* Header */}
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Masuk ke UanginKuy
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Platform Daur Ulang Sampah Terintegrasi
          </p>
        </div>

        {/* Error Message */}
        {searchParams?.error && (
          <div className="rounded-md bg-error/10 p-4">
            <p className="text-sm text-error text-center">{searchParams.error}</p>
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" action={login}>
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
                autoComplete="current-password"
                required
                placeholder="Kata Sandi"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Ingat saya
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-primary hover:text-primary-dark">
                Lupa sandi?
              </a>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full">
              Masuk
            </Button>
          </div>
        </form>
        
        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-primary hover:text-primary-dark hover:underline">
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  )
}
