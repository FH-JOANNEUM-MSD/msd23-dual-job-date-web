"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCompanies,
  deleteCompany,
  type Company,
  type CompanyStatus,
} from "./companiesApi";

export type { Company, CompanyStatus };

export function useCompaniesStore() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (error) {
      const message =
          error instanceof Error
              ? error.message
              : "Unternehmen konnten nicht geladen werden.";
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const api = useMemo(() => {
    return {
      companies,
      isLoading,
      loadError,

      async refresh() {
        await loadCompanies();
      },

      getById(id: string) {
        return companies.find((c) => c.id === id) ?? null;
      },

      async remove(id: string) {
        await deleteCompany(id);
        await loadCompanies();
      },
    };
  }, [companies, isLoading, loadError, loadCompanies]);

  return api;
}