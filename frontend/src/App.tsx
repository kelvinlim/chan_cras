import { useState } from 'react';
import Layout from './components/Layout';
import WeeklyCalendar from './components/WeeklyCalendar';
import NewEventModal from './components/NewEventModal';

function App() {
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);

  return (
    <Layout onNewEvent={() => setIsNewEventModalOpen(true)}>
      <div className="space-y-6 h-full flex flex-col">
        {/* Main Calendar View */}
        <div className="flex-1 min-h-0">
          <WeeklyCalendar />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Active Studies</p>
            <p className="text-3xl font-serif font-bold text-hku-green mt-2">12</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Total Subjects</p>
            <p className="text-3xl font-serif font-bold text-hku-green mt-2">1,204</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Events Today</p>
            <p className="text-3xl font-serif font-bold text-hku-warning mt-2">8</p>
          </div>
        </div>

        <NewEventModal
          isOpen={isNewEventModalOpen}
          onClose={() => setIsNewEventModalOpen(false)}
        />
      </div>
    </Layout>
  );
}

export default App;
