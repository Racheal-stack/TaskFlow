import { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { spaceAPI } from '../../services/api';
import { SpaceTreeItem } from './TreeItems';
import SpaceModal from './SpaceModal';
import {
  LayoutDashboard,
  Inbox,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  CheckSquare
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar({ onListClick, onAddFolder, onAddList }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const { currentWorkspace } = useWorkspace();
  const location = useLocation();

  useEffect(() => {
    if (currentWorkspace) {
      loadSpaces();
    }
  }, [currentWorkspace]);

  const loadSpaces = async () => {
    try {
      setLoading(true);
      const res = await spaceAPI.getAll(currentWorkspace._id);
      setSpaces(res.data || []);
    } catch (error) {
      console.error('Error loading spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpace = () => {
    setShowSpaceModal(true);
  };

  const handleSpaceCreated = (newSpace) => {
    setSpaces([...spaces, newSpace]);
  };

  const filteredSpaces = spaces.filter(space =>
    space.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Inbox, label: 'Inbox', path: '/inbox' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      className={`
        ${isCollapsed ? 'w-16' : 'w-64'}
        bg-white dark:bg-gray-800 
        border-r border-gray-200 dark:border-gray-700
        flex flex-col
        transition-all duration-300 ease-in-out
        relative
      `}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 hover:bg-gray-50 dark:hover:bg-gray-700 z-10"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {/* Workspace Header - Removed */}

      {/* Navigation Links */}
      <nav className="px-2 py-4 border-b border-gray-200 dark:border-gray-700">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg mb-1
                ${isActive(item.path)
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Spaces Section */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search spaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Spaces Header */}
          <div className="flex items-center justify-between px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Spaces
            </h3>
            <button
              onClick={handleAddSpace}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Add Space"
            >
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Spaces List */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
            {loading && (
              <div className="text-sm text-gray-500 text-center py-4">
                Loading spaces...
              </div>
            )}

            {!loading && filteredSpaces.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4">
                {searchQuery ? 'No spaces found' : 'No spaces yet'}
              </div>
            )}

            {filteredSpaces.map((space) => (
              <SpaceTreeItem
                key={space._id}
                space={space}
                onFolderClick={(folder) => console.log('Folder clicked:', folder)}
                onListClick={onListClick}
                onAddFolder={onAddFolder}
                onAddList={onAddList}
              />
            ))}
          </div>
        </div>
      )}

      {/* Collapsed State - Just Icons */}
      {isCollapsed && (
        <div className="flex-1 overflow-y-auto py-4">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleAddSpace}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Add Space"
            >
              <Plus className="w-5 h-5 text-gray-500" />
            </button>
            {spaces.slice(0, 5).map((space) => (
              <div
                key={space._id}
                className="w-8 h-8 rounded flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400"
                style={{ backgroundColor: space.color }}
                title={space.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Space Creation Modal */}
      <SpaceModal
        isOpen={showSpaceModal}
        onClose={() => setShowSpaceModal(false)}
        onSpaceCreated={handleSpaceCreated}
      />
    </aside>
  );
}

export default Sidebar;
