import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div className="max-w-sm mx-auto px-4 py-16 w-full">
      <h1 className="text-xl font-bold text-center mb-6">Create an account</h1>
      <RegisterForm />
    </div>
  );
}
