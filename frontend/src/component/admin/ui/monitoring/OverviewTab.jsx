import React from 'react';
import SummaryCards from './SummaryCards';
import ActivityBreakdown from './ActivityBreakdown';
import CriticalEvents from './CriticalEvents';

const OverviewTab = ({ stats, formatDate }) => {
  return (
	<div className="space-y-6">
	  {/* Summary Cards */}
	  <SummaryCards stats={stats} />
	  
	  {/* Activity Breakdown */}
	  <ActivityBreakdown stats={stats} />
	  
	  {/* Recent Critical Events */}
	  <CriticalEvents stats={stats} formatDate={formatDate} />
	</div>
  );
};

export default OverviewTab;