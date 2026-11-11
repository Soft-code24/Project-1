import { ThemeProvider } from './ThemeContext.jsx'
import { ToastProvider } from './ToastContext.jsx'
import { BusinessSettingsProvider } from './BusinessSettingsContext.jsx'
import { ProductProvider } from './ProductContext.jsx'
import { AuthProvider } from './AuthContext.jsx'
import { OrderProvider } from './OrderContext.jsx'
import { CartProvider } from './CartContext.jsx'

export function AppProviders({ children }) {
  return (
    <BusinessSettingsProvider>
      <ThemeProvider>
        <ToastProvider>
          <ProductProvider>
            <AuthProvider>
              <OrderProvider>
                <CartProvider>{children}</CartProvider>
              </OrderProvider>
            </AuthProvider>
          </ProductProvider>
        </ToastProvider>
      </ThemeProvider>
    </BusinessSettingsProvider>
  )
}
