import { Square2StackIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import { copyTextToClipboard } from "../../lib/clipboard";
import { encrypt } from "../../lib/encryption";
import {
  type GameStats,
  loadGameStateFromLocalStorage,
} from "../../lib/localStorage.client";
import { loadStats } from "../../lib/stats";
import { type MigrationStats } from "../modals/MigrateStatsModal";

export const EmigratePanel = () => {
  const [isCopyButtonEnabled, setIsCopyButtonEnabled] = useState(true);
  const [copyButtonText, setCopyButtonText] = useState("Copy");
  const [stats, setStats] = useState<GameStats>();

  const gameState = loadGameStateFromLocalStorage(true);
  useEffect(() => {
    setStats(loadStats());
  }, []);
  const migrationStats: MigrationStats = {
    statistics: stats,
    gameState,
  };

  const emigrationCode = encrypt(JSON.stringify(migrationStats));

  const copyEmigrationCodeToClipboard = () => {
    copyTextToClipboard(emigrationCode);
    setCopyButtonText("Copied!");
    setIsCopyButtonEnabled(false);
  };

  return (
    <div className="text-sm text-gray-500 dark:text-gray-300">
      <label
        htmlFor="message"
        className="mb-2 block text-left text-sm font-medium text-gray-900 dark:text-gray-400"
      >
        Copy your migration code:
      </label>
      <textarea
        id="emigration-code"
        readOnly={true}
        rows={8}
        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        value={emigrationCode}
      />
      <button
        disabled={!isCopyButtonEnabled}
        onClick={copyEmigrationCodeToClipboard}
        type="button"
        className="mt-2 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-left text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:border-gray-200
          disabled:bg-white disabled:text-gray-900 disabled:focus:outline-none disabled:dark:border-gray-600 disabled:dark:bg-gray-800 disabled:dark:text-gray-400 sm:text-sm"
      >
        {isCopyButtonEnabled && (
          <Square2StackIcon className="mr-2 h-6 w-6 cursor-pointer dark:stroke-white" />
        )}
        {copyButtonText}
      </button>
    </div>
  );
};
