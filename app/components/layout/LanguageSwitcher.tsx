import Cookies from "js-cookie";
import { useTranslation } from "react-i18next";
import { CustomSelect } from "~/components/shared/CustomSelect";
import { type SupportedLng } from "~/lib/i18n";

const options = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "tg", label: "Тоҷикӣ" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleChange = (lng: string) => {
    Cookies.set("lng", lng, { expires: 365 });
    void i18n.changeLanguage(lng);
  };

  return (
    <CustomSelect
      options={options}
      value={(i18n.language?.split("-")[0]) as SupportedLng}
      onChange={(lng) => handleChange(lng as string)}
      isClearable={false}
    />
  );
}
