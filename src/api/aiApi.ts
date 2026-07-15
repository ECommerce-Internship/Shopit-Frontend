import axiosInstance from './axiosInstance';

export type GenerateProductContentRequest = {
  productName: string;
  category: string;
  specs: string;
};

export type ProductContentResponse = {
  description: string;
  features: string[];
  seoTitle: string;
  metaDescription: string;
};

export async function generateProductContent(
  request: GenerateProductContentRequest
): Promise<ProductContentResponse> {
  const response = await axiosInstance.post<ProductContentResponse>(
    '/api/v1/ai/generate-content',
    request
  );
  return response.data;
}