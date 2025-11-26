import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, List, Plus } from 'lucide-react';
import { spaceAPI, folderAPI, listAPI } from '../../services/api';

function SpaceTreeItem({ space, onFolderClick, onListClick, onAddFolder, onAddList }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [folders, setFolders] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSpaceContent = async () => {
    if (isExpanded || loading) return;
    
    try {
      setLoading(true);
      const [foldersRes, listsRes] = await Promise.all([
        folderAPI.getAll({ spaceId: space._id }),
        listAPI.getAll({ spaceId: space._id })
      ]);
      
      setFolders(foldersRes.data || []);
      setLists(listsRes.data || []);
    } catch (error) {
      console.error('Error loading space content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isExpanded) {
      loadSpaceContent();
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="space-tree-item">
      <div
        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer group"
        onClick={handleToggle}
      >
        <button className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>
        
        <div
          className="w-3 h-3 rounded flex-shrink-0"
          style={{ backgroundColor: space.color }}
        />
        
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1 truncate">
          {space.name}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddFolder(space);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
        >
          <Plus className="w-3 h-3 text-gray-500" />
        </button>
      </div>

      {isExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {loading && (
            <div className="text-xs text-gray-500 px-3 py-2">Loading...</div>
          )}

          {/* Folders */}
          {folders.map((folder) => (
            <FolderTreeItem
              key={folder._id}
              folder={folder}
              space={space}
              onListClick={onListClick}
              onAddList={onAddList}
            />
          ))}

          {/* Direct Lists (no folder) */}
          {lists.map((list) => (
            <ListTreeItem
              key={list._id}
              list={list}
              onClick={() => onListClick(list)}
            />
          ))}

          {/* Add List Button */}
          <button
            onClick={() => onAddList(space, null)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded w-full"
          >
            <Plus className="w-3 h-3" />
            <span>Add List</span>
          </button>
        </div>
      )}
    </div>
  );
}

function FolderTreeItem({ folder, space, onListClick, onAddList }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadFolderLists = async () => {
    if (isExpanded || loading) return;
    
    try {
      setLoading(true);
      const res = await listAPI.getAll({ folderId: folder._id });
      setLists(res.data || []);
    } catch (error) {
      console.error('Error loading folder lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isExpanded) {
      loadFolderLists();
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer group"
        onClick={handleToggle}
      >
        <button className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-gray-500" />
          ) : (
            <ChevronRight className="w-3 h-3 text-gray-500" />
          )}
        </button>
        
        <Folder
          className="w-3 h-3 flex-shrink-0"
          style={{ color: folder.color }}
        />
        
        <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">
          {folder.name}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddList(space, folder);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
        >
          <Plus className="w-3 h-3 text-gray-500" />
        </button>
      </div>

      {isExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {loading && (
            <div className="text-xs text-gray-500 px-3 py-1">Loading...</div>
          )}

          {lists.map((list) => (
            <ListTreeItem
              key={list._id}
              list={list}
              onClick={() => onListClick(list)}
            />
          ))}

          <button
            onClick={() => onAddList(space, folder)}
            className="flex items-center gap-2 px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded w-full"
          >
            <Plus className="w-3 h-3" />
            <span>Add List</span>
          </button>
        </div>
      )}
    </div>
  );
}

function ListTreeItem({ list, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer group"
    >
      <div className="w-5" /> {/* Spacer for alignment */}
      <List
        className="w-3 h-3 flex-shrink-0"
        style={{ color: list.color }}
      />
      <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">
        {list.name}
      </span>
    </div>
  );
}

export { SpaceTreeItem, FolderTreeItem, ListTreeItem };
