import { redirect } from 'next/navigation';

export default function Posts() {
  // redirect to /posts
  redirect('/posts');
  return <div>Redirect failed</div>;
}
