"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface MonitoredUser {
  id: number;
  userId: number;
  reason: string;
  createdAt: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export default function MonitoredUsersPage() {
  const [users, setUsers] = useState<MonitoredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    if (role !== 'ADMIN') {
      router.replace('/login');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    fetch("http://localhost:3001/api/admin/monitored-users", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch monitored users');
        return res.json();
      })
      .then(data => setUsers(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Monitored Users</h1>
      {users.length === 0 ? (
        <div>No suspicious users detected.</div>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">User</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Role</th>
              <th className="border px-4 py-2">Reason</th>
              <th className="border px-4 py-2">Detected At</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="border px-4 py-2">{u.user?.name || u.userId}</td>
                <td className="border px-4 py-2">{u.user?.email}</td>
                <td className="border px-4 py-2">{u.user?.role}</td>
                <td className="border px-4 py-2">{u.reason}</td>
                <td className="border px-4 py-2">{new Date(u.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 