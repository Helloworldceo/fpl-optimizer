import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto px-4 py-16 w-full">
      <h1 className="text-xl font-bold text-center mb-6">Log in</h1>
      <LoginForm />
    </div>
  );
}
