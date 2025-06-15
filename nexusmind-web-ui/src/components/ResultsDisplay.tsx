import React, { useState } from 'react';
import { File, Download, Eye, Calendar, User, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { SearchResult, SearchResultItem } from '../types';
import { formatDate, truncateText, highlightText, formatFileSize } from '../utils/helpers'; // Added formatFileSize

interface ResultsDisplayProps {
  results: SearchResult;
  query: string;
  loading?: boolean;
  onDownload?: (fileId: string) => void;
  onPreview?: (fileId: string) => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  query,
  loading = false,
  onDownload,
  onPreview
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getFileIcon = (fileType: string) => {
    const iconClass = "w-5 h-5";
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <File className={`${iconClass} text-red-500`} />;
      case 'doc':
      case 'docx':
        return <File className={`${iconClass} text-blue-500`} />;
      case 'txt':
        return <File className={`${iconClass} text-gray-500`} />;
      case 'ppt':
      case 'pptx':
        return <File className={`${iconClass} text-orange-500`} />;
      default:
        return <File className={`${iconClass} text-gray-400`} />;
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="w-5 h-5 bg-gray-300 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!results.items || results.items.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-500">
          {query ? `No documents match \"${query}\"` : 'Try adjusting your search terms or filters'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {results.total} result{results.total !== 1 ? 's' : ''} found
          {query && ` for \"${query}\"`}
          {results.searchTime && ` (${results.searchTime}ms)`}
        </span>
        <span>Page {results.page} of {Math.ceil(results.total / results.perPage)}</span>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {results.items.map((item: SearchResultItem) => (
          <div
            key={item.id}
            className={`bg-white border rounded-lg transition-all hover:shadow-md ${
              selectedItem === item.id ? 'border-blue-300 shadow-md' : 'border-gray-200'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getFileIcon(item.fileType)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                          onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}>
                        {highlightText(item.title, query)}
                      </h3>
                      
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(item.lastModified)}
                        </span>
                        {item.author && (
                          <span className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {item.author}
                          </span>
                        )}
                        <span className="flex items-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${getRelevanceColor(item.relevanceScore)}`}>
                            {Math.round(item.relevanceScore * 100)}% match
                          </span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {onPreview && (
                        <button
                          onClick={() => onPreview(item.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {onDownload && (
                        <button
                          onClick={() => onDownload(item.id)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-gray-700 leading-relaxed">
                      {highlightText(truncateText(item.excerpt, expandedItems.has(item.id) ? 500 : 200), query)}
                    </p>
                    
                    {item.excerpt.length > 200 && (
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                      >
                        {expandedItems.has(item.id) ? (
                          <>
                            Show less <ChevronUp className="w-4 h-4 ml-1" />
                          </>
                        ) : (
                          <>
                            Show more <ChevronDown className="w-4 h-4 ml-1" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Expanded Details */}
                  {selectedItem === item.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">File Size:</span>
                          <span className="ml-2 text-gray-600">{formatFileSize(item.fileSize)}</span> {/* Use formatFileSize */}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">File Type:</span>
                          <span className="ml-2 text-gray-600">{item.fileType.toUpperCase()}</span>
                        </div>
                        {item.tags && item.tags.length > 0 && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-700">Tags:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.tags.map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {item.path && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-700">Path:</span>
                            <span className="ml-2 text-gray-600 font-mono text-xs">{item.path}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {results.total > results.perPage && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <button
            disabled={results.page === 1}
            className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-1">
            {[...Array(Math.min(5, Math.ceil(results.total / results.perPage)))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  // onClick={() => onPageChange(pageNum)} // Assuming onPageChange prop
                  className={`px-3 py-2 text-sm border rounded ${
                    pageNum === results.page
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            disabled={results.page === Math.ceil(results.total / results.perPage)}
            className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
