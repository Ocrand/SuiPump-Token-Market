import axios from 'axios';

const axiosInstance = axios.create({
  // baseURL: "http://localhost:9001", // 替换为实际的 API 基本 URL
  baseURL: "https://suipump.top",
  timeout: 60000,
});

export const fetchDataWithRetry = async (
    url: string,
    params: object,
    retries = 3,
    delay = 1000
): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axiosInstance.get(url, { params });
      return response.data; // 成功获取数据后，直接返回
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Attempt ${i + 1} failed: ${error.message}`);
      } else {
        console.error(`Attempt ${i + 1} failed with unexpected error:`, error);
      }

      if (i < retries - 1) {
        // 指数退避：每次重试的等待时间是上一次的两倍
        const nextDelay = delay * Math.pow(2, i);
        console.log(`Waiting for ${nextDelay} ms before retrying...`);
        await new Promise((resolve) => setTimeout(resolve, nextDelay));
      } else {
        throw new Error('Max retries reached. Fetch failed.');
      }
    }
  }
};


export const PostDataWithRetry = async (url: string, params: object, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axiosInstance.post(url, { params });
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Attempt ${i + 1} failed: ${error.message}`);
      } else {
        console.error(`Attempt ${i + 1} failed with unexpected error:`, error);
      }
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw new Error('Max retries reached. Fetch failed.');
      }
    }
  }
};

export default axiosInstance;
