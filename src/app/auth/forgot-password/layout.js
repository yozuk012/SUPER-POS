import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Reset Password dengan PIN",
  description:
    "Lupa password SuperPOS? Gunakan PIN pemulihan untuk mengatur ulang password akun kasir Anda dengan aman.",
  alternates: { canonical: "/auth/forgot-password" },
  // Halaman formulir tidak perlu muncul di hasil pencarian.
  robots: { index: false, follow: true },
  openGraph: {
    url: `${SITE_URL}/auth/forgot-password`,
    title: `Reset Password dengan PIN | ${SITE_NAME}`,
  },
};

export default function ForgotPasswordLayout({ children }) {
  return children;
}
