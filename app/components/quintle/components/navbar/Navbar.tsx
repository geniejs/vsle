import {
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

import { ENABLE_ARCHIVED_GAMES } from "../../constants/settings";
import { GAME_TITLE } from "../../constants/strings";

interface Props {
  setIsInfoModalOpen: (value: boolean) => void;
  setIsStatsModalOpen: (value: boolean) => void;
  setIsDatePickerModalOpen: (value: boolean) => void;
  setIsSettingsModalOpen: (value: boolean) => void;
}

export const Navbar = ({
  setIsInfoModalOpen,
  setIsStatsModalOpen,
  setIsDatePickerModalOpen,
  setIsSettingsModalOpen,
}: Props) => {
  return (
    <div className="navbar">
      <div className="navbar-content short:h-auto px-5">
        <div className="flex">
          <InformationCircleIcon
            className="h-6 w-6 cursor-pointer dark:stroke-white"
            onClick={() => { setIsInfoModalOpen(true); }}
          />
          {ENABLE_ARCHIVED_GAMES && (
            <CalendarIcon
              className="ml-3 h-6 w-6 cursor-pointer dark:stroke-white"
              onClick={() => { setIsDatePickerModalOpen(true); }}
            />
          )}
        </div>
        <p className="text-xl font-bold dark:text-white">{GAME_TITLE}</p>
        <div className="right-icons">
          <ChartBarIcon
            className="mr-3 h-6 w-6 cursor-pointer dark:stroke-white"
            onClick={() => { setIsStatsModalOpen(true); }}
          />
          <CogIcon
            className="h-6 w-6 cursor-pointer dark:stroke-white"
            onClick={() => { setIsSettingsModalOpen(true); }}
          />
        </div>
      </div>
      <hr></hr>
    </div>
  );
};
