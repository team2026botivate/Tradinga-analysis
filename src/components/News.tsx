import React, { useState } from 'react';
import {
  TrendingUp,
  Clock,
  ExternalLink,
  Search,
  Bookmark,
  Share2
} from 'lucide-react';

const News: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All News' },
    { id: 'markets', label: 'Markets' },
    { id: 'stocks', label: 'Stocks' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'economy', label: 'Economy' },
    { id: 'earnings', label: 'Earnings' },
  ];

  const newsArticles = [
    {
      id: 1,
      title: 'RBI Signals Policy Pause Amid Easing Inflation',
      summary: 'RBI likely to maintain status quo as CPI trends lower; focus shifts to liquidity and transmission.',
      source: 'Mint',
      author: 'Aarav Mehta',
      publishTime: '2 hours ago',
      readTime: '3 min read',
      category: 'economy',
      tags: ['Fed', 'Interest Rates', 'Inflation'],
      image: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      trending: true,
      saved: false
    },
    {
      id: 2,
      title: 'IT Stocks Rise as Deal Wins Boost Outlook',
      summary: 'Indian IT majors gain on strong deal pipeline and resilient US demand outlook.',
      source: 'Economic Times',
      author: 'Priya Nair',
      publishTime: '4 hours ago',
      readTime: '4 min read',
      category: 'stocks',
      tags: ['AI', 'Technology', 'FAANG'],
      image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      trending: true,
      saved: true
    },
    {
      id: 3,
      title: 'Crypto Tax Rules Clarified Ahead of Festive Season',
      summary: 'Government clarifies TDS and reporting requirements; exchanges welcome guidance.',
      source: 'Business Standard',
      author: 'Rahul Gupta',
      publishTime: '6 hours ago',
      readTime: '2 min read',
      category: 'crypto',
      tags: ['Bitcoin', 'Cryptocurrency', 'Institutional'],
      image: 'https://images.pexels.com/photos/6771899/pexels-photo-6771899.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      trending: false,
      saved: false
    },
    {
      id: 4,
      title: 'PSU Energy Stocks Extend Rally on Dividend Hopes',
      summary: 'ONGC, Coal India advance as crude stabilizes; investors eye dividend payouts.',
      source: 'Moneycontrol',
      author: 'Sneha Kapoor',
      publishTime: '8 hours ago',
      readTime: '5 min read',
      category: 'stocks',
      tags: ['Energy', 'Earnings', 'Oil'],
      image: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      trending: false,
      saved: false
    },
    {
      id: 5,
      title: 'Volatility Seen Ahead of Nifty Monthly Expiry',
      summary: 'Traders brace for sharp moves as F&O expiry approaches; Bank Nifty in focus.',
      source: 'CNBC-TV18',
      author: 'Karan Shah',
      publishTime: '12 hours ago',
      readTime: '3 min read',
      category: 'markets',
      tags: ['FOMC', 'Volatility', 'Trading'],
      image: 'https://images.pexels.com/photos/6802042/pexels-photo-6802042.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      trending: false,
      saved: true
    }
  ];

  const filteredNews = newsArticles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const topStories = newsArticles.filter(article => article.trending).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Market News</h1>
          <p className="text-slate-600 mt-1">Stay updated with the latest financial news</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors">
            <Bookmark className="h-4 w-4" />
            <span>Saved</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search news articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Stories */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-bold text-slate-900">Trending Stories</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topStories.map((article) => (
            <div key={article.id} className="group cursor-pointer">
              <div className="aspect-video bg-slate-200 rounded-xl mb-3 overflow-hidden">
                <img 
                  src={article.image} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {article.title}
              </h3>
              <div className="flex items-center justify-between mt-2 text-sm text-slate-600">
                <span>{article.source}</span>
                <span>{article.publishTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* News Feed */}
      <div className="space-y-4">
        {filteredNews.map((article) => (
          <div key={article.id} className="bg-white rounded-2xl p-6 border border-slate-200 hover:bg-slate-50 hover:shadow-sm transition-colors">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-48 flex-shrink-0">
                <div className="aspect-video bg-slate-200 rounded-xl overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </div>
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      {article.trending && (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                          <TrendingUp className="h-3 w-3" />
                          <span>Trending</span>
                        </span>
                      )}
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium capitalize">
                        {article.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer">
                      {article.title}
                    </h3>
                    <p className="text-slate-600 mt-2">
                      {article.summary}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button 
                      className={`p-2 rounded-lg transition-colors ${
                        article.saved 
                          ? 'text-yellow-600 bg-yellow-100' 
                          : 'text-slate-400 hover:text-yellow-600 hover:bg-yellow-100'
                      }`}
                    >
                      <Bookmark className="h-4 w-4" fill={article.saved ? 'currentColor' : 'none'} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">{article.source}</span>
                      <span>•</span>
                      <span>{article.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{article.publishTime}</span>
                    </div>
                    <span>{article.readTime}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <button className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium">
          Load More Articles
        </button>
      </div>
    </div>
  );
};

export default News;