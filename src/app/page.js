import { redirect } from "next/navigation";

/**
 * Domain utama selalu mengarah ke halaman panduan publik.
 *
 * Sebelumnya halaman ini hanya merender spinner lalu mengalihkan lewat
 * JavaScript, sehingga crawler menerima halaman kosong dan Google memilih
 * URL lain (mis. /auth/register) sebagai halaman masuk domain.
 *
 * Redirect di server memastikan siapa pun yang membuka domain langsung
 * sampai ke /welcome tanpa bergantung pada JavaScript.
 */
export default function RootPage() {
  redirect("/welcome");
}
