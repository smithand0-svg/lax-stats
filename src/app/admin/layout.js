import AdminNav from '@/components/AdminNav';

// TM-33: every admin page gets the same navigation bar from here.
export default function AdminLayout({ children }) {
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
