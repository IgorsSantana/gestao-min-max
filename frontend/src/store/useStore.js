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
      }),

      updateSimulatedProducts: (codInterno, newProducts) => set((state) => {
        const drafts = { ...state.draftEdits };
        // Remove os drafts antigos que pertenciam a esse COD_INTERNO (caso mude as lojas)
        Object.keys(drafts).forEach(key => {
          if (key.endsWith(`_${codInterno}`)) {
            delete drafts[key];
          }
        });

        const filteredSimulated = state.simulatedProducts.filter(p => p.COD_INTERNO !== codInterno);

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
          simulatedProducts: [...filteredSimulated, ...newProducts],
          draftEdits: drafts
        };
      }),

      removeSimulatedProduct: (codInterno) => set((state) => {
        const drafts = { ...state.draftEdits };
        // Remove todos os drafts relacionados a essa simulação (em todas as lojas)
        Object.keys(drafts).forEach(key => {
          if (key.endsWith(`_${codInterno}`)) {
            delete drafts[key];
          }
        });

        // Remove do array de simulados
        const filteredSimulated = state.simulatedProducts.filter(p => p.COD_INTERNO !== codInterno);

        return {
          simulatedProducts: filteredSimulated,
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
