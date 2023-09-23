const BASE_URL = 'https://api.github.com';
const ORG_NAME = 'ubiquity';
const TOKEN = process.env.GITHUB_TOKEN; // Read from environment variable

if (!TOKEN) {
    throw new Error('GITHUB_TOKEN environment variable is not set.');
}

// Updated return type to include both repo name and default branch
async function fetchRepos(orgName: string): Promise<{ name: string; default_branch: string }[]> {
    let repos: { name: string; default_branch: string }[] = [];
    let page = 1;
    const perPage = 100; // Fetch 100 repos at a time

    while (true) {
        const url = `${BASE_URL}/orgs/${orgName}/repos?per_page=${perPage}&page=${page}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        const currentRepos = await response.json();
        if (currentRepos.length === 0) {
            break; // No more repositories to fetch
        }

        repos = repos.concat(currentRepos.map((repo: any) => ({ name: repo.name, default_branch: repo.default_branch })));
        page++;
    }

    return repos;
}


// Updated function to use default branch for the URL
async function checkFileExists(repoName: string, defaultBranch: string): Promise<boolean> {
    const url = `${BASE_URL}/repos/${ORG_NAME}/${repoName}/contents/.github/ubiquibot-config.yml?ref=${defaultBranch}`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    return response.status === 200;
}

async function main() {
    const repos = await fetchRepos(ORG_NAME);
    const validUrls: string[] = [];

    for (const repo of repos) {
        const exists = await checkFileExists(repo.name, repo.default_branch);
        if (exists) {
            validUrls.push(`https://github.com/${ORG_NAME}/${repo.name}/blob/${repo.default_branch}/.github/ubiquibot-config.yml`);
        }
    }

    console.log(validUrls);
}

main().catch(error => {
    console.error("Error:", error);
});
