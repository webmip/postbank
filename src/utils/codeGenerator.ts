import { Request } from '../types';

interface CodeTemplate {
  [key: string]: (request: Request) => string;
}

const templates: CodeTemplate = {
  curl: (request: Request) => {
    const enabledHeaders = Object.entries(request.headers)
      .filter(([_, value]) => value.enabled)
      .map(([key, value]) => `-H '${key}: ${value.value}'`)
      .join(' ');

    let command = `curl -X ${request.method} '${request.url}'`;
    if (enabledHeaders) {
      command += ` ${enabledHeaders}`;
    }
    if (request.body && request.method !== 'GET') {
      command += ` -d '${request.body}'`;
    }
    return command;
  },

  javascript: (request: Request) => {
    const enabledHeaders = Object.entries(request.headers)
      .filter(([_, value]) => value.enabled)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value.value }), {});

    return `fetch('${request.url}', {
  method: '${request.method}',
  headers: ${JSON.stringify(enabledHeaders, null, 2)},
  ${request.body && request.method !== 'GET' ? `body: ${request.body}` : ''}
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;
  },

  python: (request: Request) => {
    const enabledHeaders = Object.entries(request.headers)
      .filter(([_, value]) => value.enabled)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value.value }), {});

    return `import requests

response = requests.${request.method.toLowerCase()}(
    '${request.url}',
    headers=${JSON.stringify(enabledHeaders, null, 2)},
    ${request.body && request.method !== 'GET' ? `data='${request.body}'` : ''}
)

print(response.json())`;
  },

  php: (request: Request) => {
    const enabledHeaders = Object.entries(request.headers)
      .filter(([_, value]) => value.enabled)
      .map(([key, value]) => `$headers[] = '${key}: ${value.value}';`)
      .join('\n');

    return `<?php
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => '${request.url}',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => '${request.method}',
    ${request.body && request.method !== 'GET' ? `CURLOPT_POSTFIELDS => '${request.body}',` : ''}
]);

$headers = [];
${enabledHeaders}

curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
    echo "Error: " . $err;
} else {
    echo $response;
}`;
  }
};

export const generateCode = (request: Request, language: keyof typeof templates): string => {
  const generator = templates[language];
  if (!generator) {
    throw new Error(`Language ${language} not supported`);
  }
  return generator(request);
};

export const supportedLanguages = Object.keys(templates);