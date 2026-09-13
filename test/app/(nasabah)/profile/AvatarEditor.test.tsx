// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AvatarEditor } from "@/app/(nasabah)/profile/_components/AvatarEditor"

vi.mock("@/app/(nasabah)/profile/actions", () => ({
  uploadAvatar: vi.fn(),
  removeAvatar: vi.fn(),
}))

beforeEach(() => {
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:mock-url"),
    revokeObjectURL: vi.fn(),
  })

  class MockImage {
    onload: (() => void) | null = null
    width = 800
    height = 600
    set src(_val: string) {
      setTimeout(() => this.onload?.(), 0)
    }
  }
  vi.stubGlobal("Image", MockImage)

  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    drawImage: vi.fn(),
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext

  HTMLCanvasElement.prototype.toBlob = vi.fn((callback: (blob: Blob | null) => void) => {
    callback(new Blob(["compressed"], { type: "image/webp" }))
  }) as unknown as typeof HTMLCanvasElement.prototype.toBlob
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("AvatarEditor Component", () => {
  it("renders user initials when avatarUrl is null", () => {
    render(<AvatarEditor avatarUrl={null} name="Budi Santoso" />)
    expect(screen.getByText("BS")).toBeInTheDocument()
    expect(screen.getByText("Pilih foto")).toBeInTheDocument()
  })

  it("renders user avatar when avatarUrl is provided", () => {
    render(<AvatarEditor avatarUrl="https://example.com/avatar.jpg" name="Budi Santoso" />)
    const img = screen.getByRole("img", { name: /Foto profil Budi Santoso/i })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg")
    expect(screen.getByRole("button", { name: /Hapus/i })).toBeInTheDocument()
  })

  it("allows selecting a valid image (<= 2 MB) and displays the Simpan button", async () => {
    render(<AvatarEditor avatarUrl={null} name="Budi Santoso" />)

    const fileInput = document.querySelector('input[name="avatar"]') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()

    const validFile = new File(["dummy image content"], "avatar.jpg", { type: "image/jpeg" })
    fireEvent.change(fileInput, { target: { files: [validFile] } })

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Simpan/i })).toBeInTheDocument()
    })
    expect(screen.queryByText(/Ukuran foto maksimal 2 MB/i)).not.toBeInTheDocument()
  })

  it("rejects image exceeding 2 MB and displays error message", () => {
    render(<AvatarEditor avatarUrl={null} name="Budi Santoso" />)

    const fileInput = document.querySelector('input[name="avatar"]') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()

    // 3 MB file
    const oversizedContent = new Uint8Array(3 * 1024 * 1024)
    const largeFile = new File([oversizedContent], "large-avatar.jpg", { type: "image/jpeg" })

    fireEvent.change(fileInput, { target: { files: [largeFile] } })

    expect(screen.getByText("Ukuran foto maksimal 2 MB.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Simpan/i })).not.toBeInTheDocument()
  })

  it("rejects unsupported file formats and displays error message", () => {
    render(<AvatarEditor avatarUrl={null} name="Budi Santoso" />)

    const fileInput = document.querySelector('input[name="avatar"]') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()

    const invalidFile = new File(["not an image"], "document.pdf", { type: "application/pdf" })

    fireEvent.change(fileInput, { target: { files: [invalidFile] } })

    expect(screen.getByText("Format foto harus JPG, PNG, atau WebP.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Simpan/i })).not.toBeInTheDocument()
  })
})
