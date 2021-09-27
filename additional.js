priors = [];
cov_estimates = [];
function initialize(X, K) {
  priors = [0.5, 0.5];
  var mu0 = X[0][Math.floor(Math.random() * X[0].length)];
  var mu1 = X[1][Math.floor(Math.random() * X[0].length)];
  mu_estimates = [mu0, mu1];
  for (i = 0; i < X[0].length - 1; i++) {
    a = jStat.normal.pdf(X[0][i], mu0, sd);
    b = jStat.normal.pdf(Xi[0][i], mu1, sd);
    a = cov_estimates.push({ a: a, b: b });
  }
  for (i = 0; i < X[1].length - 1; i++) {
    a = jStat.normal.pdf(X[1][i], mu0, sd);
    b = jStat.normal.pdf(Xi[1][i], mu1, sd);
    a = cov_estimates.push({ a: a, b: b });
  }
  return mu_estimates, cov_estimates, priors;
}
