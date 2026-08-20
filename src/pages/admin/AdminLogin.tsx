import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Package, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'johnpaulchirwa@gmail.com',
      password: 'password123',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success('Login successful');
      navigate(from, { replace: true });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: userCredential.user.email,
            role: 'ADMIN',
            createdAt: Date.now()
          });
          toast.success('Admin account created and logged in!');
          navigate(from, { replace: true });
        } catch (createError: any) {
          toast.error(createError.message || 'Failed to login or create account');
        }
      } else {
        toast.error(error.message || 'Failed to login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-12 h-12 bg-zinc-900 text-white rounded-xl flex items-center justify-center mb-4">
          <Package className="w-6 h-6" />
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-900">
          Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Sign in to manage JR Logistics Connection
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-zinc-200 sm:rounded-2xl sm:px-10">
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg text-sm">
            <strong>Default Demo Credentials</strong><br/>
            Email: johnpaulchirwa@gmail.com<br/>
            Password: password123<br/>
            <span className="text-xs opacity-80 mt-1 block">(Account will be auto-created if it doesn't exist)</span>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  {...register('email')}
                  type="email"
                  className={`block w-full rounded-lg border-0 py-2 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 px-3 ${
                    errors.email 
                      ? 'ring-red-300 focus:ring-red-500 text-red-900 placeholder:text-red-300' 
                      : 'ring-zinc-300 focus:ring-zinc-900 text-zinc-900 placeholder:text-zinc-400'
                  }`}
                  placeholder="admin@example.com"
                />
                {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Password
              </label>
              <div className="mt-2">
                <input
                  {...register('password')}
                  type="password"
                  className={`block w-full rounded-lg border-0 py-2 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 px-3 ${
                    errors.password 
                      ? 'ring-red-300 focus:ring-red-500 text-red-900 placeholder:text-red-300' 
                      : 'ring-zinc-300 focus:ring-zinc-900 text-zinc-900 placeholder:text-zinc-400'
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-zinc-900 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-50 transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
