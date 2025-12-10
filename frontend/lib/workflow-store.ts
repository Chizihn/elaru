import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WorkflowAgent {
  id: string;
  name: string;
  serviceType: string;
  description: string;
  endpoint: string;
  walletAddress: string;
  reputationScore: number;
  pricePerRequest: string;
  stakedAmount: string;
}

interface WorkflowStore {
  // State
  selectedAgents: WorkflowAgent[];
  isWorkflowMode: boolean;
  
  // Actions
  addAgent: (agent: WorkflowAgent) => void;
  removeAgent: (agentId: string) => void;
  clearWorkflow: () => void;
  toggleWorkflowMode: () => void;
  reorderAgents: (fromIndex: number, toIndex: number) => void;
  isAgentSelected: (agentId: string) => boolean;
  getTotalCost: () => number;
}

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedAgents: [],
      isWorkflowMode: false,

      // Add agent to workflow
      addAgent: (agent) => {
        const { selectedAgents } = get();
        // Prevent duplicates
        if (selectedAgents.some(a => a.id === agent.id)) return;
        // Max 5 agents in workflow
        if (selectedAgents.length >= 5) return;
        
        set({ selectedAgents: [...selectedAgents, agent] });
      },

      // Remove agent from workflow
      removeAgent: (agentId) => {
        set({
          selectedAgents: get().selectedAgents.filter(a => a.id !== agentId)
        });
      },

      // Clear all selected agents
      clearWorkflow: () => {
        set({ selectedAgents: [], isWorkflowMode: false });
      },

      // Toggle workflow selection mode
      toggleWorkflowMode: () => {
        set({ isWorkflowMode: !get().isWorkflowMode });
      },

      // Reorder agents in workflow
      reorderAgents: (fromIndex, toIndex) => {
        const { selectedAgents } = get();
        const newAgents = [...selectedAgents];
        const [removed] = newAgents.splice(fromIndex, 1);
        newAgents.splice(toIndex, 0, removed);
        set({ selectedAgents: newAgents });
      },

      // Check if agent is selected
      isAgentSelected: (agentId) => {
        return get().selectedAgents.some(a => a.id === agentId);
      },

      // Calculate total cost
      getTotalCost: () => {
        return get().selectedAgents.reduce((total, agent) => {
          return total + parseInt(agent.pricePerRequest || '0');
        }, 0);
      },
    }),
    {
      name: 'elaru-workflow',
      // Only persist selectedAgents
      partialize: (state) => ({ selectedAgents: state.selectedAgents }),
    }
  )
);

// Helper to format price from wei to USDC
export const formatWorkflowPrice = (priceWei: number): string => {
  return `$${(priceWei / 1000000).toFixed(2)}`;
};
