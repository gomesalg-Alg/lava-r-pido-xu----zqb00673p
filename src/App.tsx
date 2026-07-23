import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import WelcomePage from './pages/admin/Welcome'
import NewCustomer from './pages/admin/NewCustomer'
import AdminLayout from './components/admin/AdminLayout'
import CompanyListPage from './pages/admin/CompanyListPage'
import CompanyPage from './pages/admin/CompanyPage'
import ServicesPage from './pages/admin/ServicesPage'
import UsersPage from './pages/admin/UsersPage'
import CustomersPage from './pages/admin/CustomersPage'
import EditCustomer from './pages/admin/EditCustomer'
import VehiclesPage from './pages/admin/VehiclesPage'
import EditVehicle from './pages/admin/EditVehicle'
import SuppliersPage from './pages/admin/SuppliersPage'
import NewSupplier from './pages/admin/NewSupplier'
import EditSupplier from './pages/admin/EditSupplier'
import ServiceOrdersPage from './pages/admin/ServiceOrdersPage'
import NewServiceOrder from './pages/admin/NewServiceOrder'
import EditServiceOrder from './pages/admin/EditServiceOrder'
import PrintServiceOrderPage from './pages/admin/PrintServiceOrderPage'
import EnvironmentConfigPage from './pages/admin/EnvironmentConfigPage'
import PublicServiceOrder from './pages/PublicServiceOrder'
import AccountCategoriesPage from './pages/admin/AccountCategoriesPage'
import ProductsPage from './pages/admin/ProductsPage'
import PosPage from './pages/admin/PosPage'
import AccountsReceivablePage from './pages/admin/AccountsReceivablePage'
import CardRatesPage from './pages/admin/CardRatesPage'
import ReceiptPage from './pages/admin/ReceiptPage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

const App = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/os/:id" element={<PublicServiceOrder />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<WelcomePage />} />
            <Route path="monitoramento" element={<AdminDashboard />} />
            <Route path="empresa" element={<CompanyListPage />} />
            <Route path="empresa/novo" element={<CompanyPage />} />
            <Route path="empresa/:id/editar" element={<CompanyPage />} />
            <Route path="servicos" element={<ServicesPage />} />
            <Route path="usuarios" element={<UsersPage />} />
            <Route path="clientes" element={<CustomersPage />} />
            <Route path="clientes/novo" element={<NewCustomer />} />
            <Route path="clientes/:id/editar" element={<EditCustomer />} />
            <Route path="veiculos" element={<VehiclesPage />} />
            <Route path="veiculos/:id/editar" element={<EditVehicle />} />
            <Route path="fornecedores" element={<SuppliersPage />} />
            <Route path="fornecedores/novo" element={<NewSupplier />} />
            <Route path="fornecedores/:id/editar" element={<EditSupplier />} />
            <Route path="ordem-servico" element={<ServiceOrdersPage />} />
            <Route path="ordem-servico/novo" element={<NewServiceOrder />} />
            <Route path="ordem-servico/:id/editar" element={<EditServiceOrder />} />
            <Route path="ordem-servico/:id/imprimir" element={<PrintServiceOrderPage />} />
            <Route path="ambiente" element={<EnvironmentConfigPage />} />
            <Route path="plano-contas" element={<AccountCategoriesPage />} />
            <Route path="produtos" element={<ProductsPage />} />
            <Route path="bandeiras" element={<CardRatesPage />} />
            <Route path="frente-caixa" element={<PosPage />} />
            <Route path="contas-receber" element={<AccountsReceivablePage />} />
            <Route path="recibo/:id" element={<ReceiptPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
