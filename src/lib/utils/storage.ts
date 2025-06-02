interface StoredContract {
  pdfBase64: string;
  fileName: string;
  contract: {
    id: string;
    campaign_id: string;
    influencer_id: string;
    contract_data: {
      fee: number;
      deadline: string;
      template_id: string;
      generated_at: string;
    };
    status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "COMPLETED";
    created_at: string;
    updated_at: string;
  };
  timestamp: string;
}

export const saveContractToLocalStorage = (contractData: StoredContract) => {
  try {
    localStorage.setItem(`contract_${contractData.contract.id}`, JSON.stringify(contractData));
    return true;
  } catch (error) {
    console.error('Error saving contract to localStorage:', error);
    return false;
  }
};

export const getContractFromLocalStorage = (contractId: string): StoredContract | null => {
  try {
    const data = localStorage.getItem(`contract_${contractId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting contract from localStorage:', error);
    return null;
  }
};

export const getAllContractsFromLocalStorage = (): StoredContract[] => {
  try {
    return Object.keys(localStorage)
      .filter(key => key.startsWith('contract_'))
      .map(key => {
        try {
          const data = localStorage.getItem(key);
          return data ? JSON.parse(data) : null;
        } catch {
          return null;
        }
      })
      .filter((contract): contract is StoredContract => contract !== null)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Error getting all contracts from localStorage:', error);
    return [];
  }
};

export const deleteContractFromLocalStorage = (contractId: string): boolean => {
  try {
    localStorage.removeItem(`contract_${contractId}`);
    return true;
  } catch (error) {
    console.error('Error deleting contract from localStorage:', error);
    return false;
  }
}; 