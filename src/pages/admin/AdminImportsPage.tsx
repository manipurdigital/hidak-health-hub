import { AdminLayoutWrapper } from "@/components/AdminLayoutWrapper";
import { ImportManagement } from "@/components/admin/ImportManagement";

const AdminImportsPage = () => {
  return (
    <AdminLayoutWrapper>
      <div className="container mx-auto py-6">
        <ImportManagement />
      </div>
    </AdminLayoutWrapper>
  );
};

export default AdminImportsPage;