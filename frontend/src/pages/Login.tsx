import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { GalleryVerticalEnd } from 'lucide-react';
import { useAuthForm } from '@/hooks/useAuthForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    FieldDescription,
    FieldGroup,
} from '@/components/ui/field';
import { cn } from '@/lib/utils';

// --- ZOD SCHEMA ---

const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email({ message: 'Please enter a valid email address' }),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(50, 'Password must not exceed 50 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// --- COMPONENT ---

const Login = () => {
    const { error, loading, submitForm, clearError } = useAuthForm('/auth/login');

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const handleInputChange = () => {
        if (error) clearError();
    };

    return (
        <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className={cn('flex flex-col gap-6')}>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(submitForm)}>
                            <FieldGroup>
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <Link
                                        to="/"
                                        className="flex flex-col items-center gap-2 font-medium"
                                    >
                                        <div className="flex size-8 items-center justify-center rounded-md">
                                            <GalleryVerticalEnd className="size-6" />
                                        </div>
                                        <span className="sr-only">Rate Limiter Dashboard</span>
                                    </Link>
                                    <h1 className="text-xl font-bold">Welcome Back</h1>
                                    <FieldDescription>
                                        Don&apos;t have an account?{' '}
                                        <Link to="/signup" className="underline underline-offset-4">
                                            Sign up
                                        </Link>
                                    </FieldDescription>
                                </div>

                                {error && (
                                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                        {error}
                                    </div>
                                )}

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="m@example.com"
                                                    autoComplete="email"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        handleInputChange();
                                                    }}
                                                    disabled={loading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="Enter your password"
                                                    autoComplete="current-password"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        handleInputChange();
                                                    }}
                                                    disabled={loading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Logging in...' : 'Login'}
                                </Button>
                            </FieldGroup>
                        </form>
                    </Form>

                    <FieldDescription className="px-6 text-center">
                        By continuing, you agree to our{' '}
                        <a href="#" className="underline underline-offset-4">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="underline underline-offset-4">
                            Privacy Policy
                        </a>
                        .
                    </FieldDescription>
                </div>
            </div>
        </div>
    );
};

export default Login;