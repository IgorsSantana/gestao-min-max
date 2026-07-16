import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // --- Estado Global ---
      draftEdits: {},
      simulatedProducts: [],

      // --- Actions ---
      setDraftEdits: (drafts) => {
        // Aceita tanto uma função de atualização quanto um objeto direto
        set((state) => ({
          draftEdits: typeof drafts === 'function' ? drafts(state.draftEdits) : drafts
        }));
      },
      
      clearDraftEdits: () => set({ draftEdits: {} }),

      addSimulatedProducts: (newProducts) => set((state) => {
        const drafts = { ...state.draftEdits };
        newProducts.forEach(prod => {
          const rowId = `${prod.EMPRESA}_${prod.COD_INTERNO}`;
          drafts[rowId] = {
            idEmpresa: prod.EMPRESA,
            idProduto: prod.IDPRODUTO,
            idSubProduto: prod.COD_INTERNO,
            min: prod.QTD_MIN_REAL,
            max: prod.QTD_MAX_REAL,
            inativoCompra: 'F'
          };
        });

        return {
          simulatedProducts: [...state.simulatedProducts, ...newProducts],
          draftEdits: drafts
        };
      })
    }),
    {
      name: 'gestao-min-max-storage', // Nome da chave no localStorage
      partialize: (state) => ({ draftEdits: state.draftEdits }), // Salva APENAS os drafts no localStorage (para não pesar os produtos simulados gigantes)
    }
  )
);

export default useStore;
