import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'motion/react';

const routeLabels: Record<string, string> = {
  '/services': 'Услуги',
  '/about': 'О компании',
  '/faq': 'FAQ',
  '/contacts': 'Контакты',
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Don't show breadcrumbs on homepage or admin pages
  if (location.pathname === '/' || location.pathname.startsWith('/admin')) return null;

  return (
    <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest"
      >
        <Link 
          to="/" 
          className="text-gray-500 hover:text-accent-orange transition-colors flex items-center gap-1"
        >
          <Home className="w-3 h-3" />
          <span>Главная</span>
        </Link>

        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const label = routeLabels[to] || value;

          return (
            <div key={to} className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-700" />
              {last ? (
                <span className="text-accent-orange font-bold">
                  {label}
                </span>
              ) : (
                <Link 
                  to={to} 
                  className="text-gray-500 hover:text-accent-orange transition-colors"
                >
                  {label}
                </Link>
              )}
            </div>
          );
        })}
      </motion.div>
    </nav>
  );
}
