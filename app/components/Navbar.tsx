import Link from "next/link";
import SearchModal from "./SearchModal";
import ThemeBtn from "./ThemeBtn";
import SidePanel from "./SidePanel";
export const Navigation = () => {
  return (
    <nav className="bg-white/50 dark:bg-gray-800/50 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <SidePanel />
          <Link 
            href="/" 
            className="flex items-center ml-2 px-2 text-gray-900 dark:text-white font-semibold"
          >
            Blog
          </Link>
          <div className="flex flex-1 justify-end">
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/posts"
                className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                Posts
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <SearchModal />
            <ThemeBtn />
          </div>
        </div>
      </div>
    </nav>
  );
}