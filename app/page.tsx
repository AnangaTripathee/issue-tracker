import { redirect } from 'next/navigation';

// The issues list is the app's starting page.
export default function Home() {
  redirect('/issues');
}
