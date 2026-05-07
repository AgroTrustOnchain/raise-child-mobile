const BASE = "https://provinces.open-api.vn/api/v2";

export interface Province {
  code: number;
  name: string;
}

export interface Ward {
  code: number;
  name: string;
  province_code: number;
}

export const getProvinces = async (): Promise<Province[]> => {
  const res = await fetch(`${BASE}/p/`);
  if (!res.ok) throw new Error("Failed to fetch provinces");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const getWardsByProvince = async (
  provinceCode: number,
): Promise<Ward[]> => {
  const res = await fetch(`${BASE}/w/?province=${provinceCode}`);
  if (!res.ok) throw new Error("Failed to fetch wards");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};
