import React, { useState, useEffect } from 'react';

// ✅ API base URL for development vs production
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080';

interface CostData {
  totalCost: string;
  totalRequests: number;
  averageCostPerRequest: string;
  costHistory: Array<{
    timestamp: string;
    cost: string;
    tokens: number;
    totalCost: string;
  }>;
  estimatedRemainingRequests: number;
}

const CostTracker: React.FC = () => {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/costs`);
      const data = await response.json();
      if (data.success) {
        setCostData(data.costs);
      }
    } catch (error) {
      console.error('Failed to fetch cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCosts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCosts, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="cost-tracker">Loading cost data...</div>;
  }

  if (!costData) {
    return <div className="cost-tracker">No cost data available</div>;
  }

  return (
    <div className="cost-tracker">
      <h3>💰 Cost Tracking</h3>
      
      <div className="cost-summary">
        <div className="cost-item">
          <span className="label">Total Cost:</span>
          <span className="value">${costData.totalCost}</span>
        </div>
        
        <div className="cost-item">
          <span className="label">Requests:</span>
          <span className="value">{costData.totalRequests}</span>
        </div>
        
        <div className="cost-item">
          <span className="label">Avg per Request:</span>
          <span className="value">${costData.averageCostPerRequest}</span>
        </div>
        
        <div className="cost-item">
          <span className="label">Remaining (est.):</span>
          <span className="value">{costData.estimatedRemainingRequests} requests</span>
        </div>
      </div>

      <div className="cost-history">
        <h4>Recent Requests</h4>
        {costData.costHistory.length > 0 ? (
          <div className="history-list">
            {costData.costHistory.map((item, index) => (
              <div key={index} className="history-item">
                <span className="time">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
                <span className="cost">${item.cost}</span>
                <span className="tokens">{item.tokens} tokens</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No requests yet</p>
        )}
      </div>

      <button onClick={fetchCosts} className="refresh-btn">
        🔄 Refresh
      </button>
    </div>
  );
};

export default CostTracker; 