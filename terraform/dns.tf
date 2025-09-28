resource "cloudflare_dns_record" "terraform_managed_resource_998566ad74915843160f3cfb62606a2f_0" {
  content = "abhiaagarwal.pages.dev"
  name    = var.domain
  proxied = true
  tags    = []
  ttl     = 1
  type    = "CNAME"
  zone_id = var.zone_id
  settings = {
    flatten_cname = false
  }
}

resource "cloudflare_dns_record" "terraform_managed_resource_154510c03daa4dd5a2e4140c00f5040a_1" {
  content = "sig1.dkim.${var.domain}.at.icloudmailadmin.com"
  name    = "sig1._domainkey.${var.domain}"
  proxied = false
  tags    = []
  ttl     = 3600
  type    = "CNAME"
  zone_id = var.zone_id
  settings = {
    flatten_cname = false
  }
}

resource "cloudflare_dns_record" "terraform_managed_resource_565957687e5670618c3d884289a4e6ca_2" {
  content  = "mx01.mail.icloud.com"
  name     = var.domain
  priority = 10
  proxied  = false
  tags     = []
  ttl      = 3600
  type     = "MX"
  zone_id  = var.zone_id
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_8299a7494d5743fa6829a71a3b7a7aa9_3" {
  content  = "mx02.mail.icloud.com"
  name     = var.domain
  priority = 10
  proxied  = false
  tags     = []
  ttl      = 3600
  type     = "MX"
  zone_id  = var.zone_id
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_546fd90307db1294bf0bd1c8659d951a_4" {
  content  = "sevki.ns.cloudflare.com"
  name     = var.domain
  proxied  = false
  tags     = []
  ttl      = 86400
  type     = "NS"
  zone_id  = var.zone_id
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_cf01e738d810b28ba703e30f2a13a791_5" {
  content  = "addilyn.ns.cloudflare.com"
  name     = var.domain
  proxied  = false
  tags     = []
  ttl      = 86400
  type     = "NS"
  zone_id  = var.zone_id
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_f3693c9c71a2f815b45070016083a673_6" {
  content  = "\"google-site-verification=wGvdqwfcGXjRHDMeoj2i-xYLgtIiKidU9Rognm6Dd6o\""
  name     = var.domain
  proxied  = false
  tags     = []
  ttl      = 3600
  type     = "TXT"
  zone_id  = var.zone_id
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_f333140099ae0028f9f7947c24e8f1ae_7" {
  content  = "\"v=spf1 include:icloud.com ~all\""
  name     = var.domain
  proxied  = false
  tags     = []
  ttl      = 3600
  type     = "TXT"
  zone_id  = var.zone_id
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_e5c509b8ad61e6f0cbe49b073ecf0ed0_8" {
  content  = "\"apple-domain=vKtsyjS4uehdhDIM\""
  name     = var.domain
  proxied  = false
  tags     = []
  ttl      = 3600
  type     = "TXT"
  zone_id  = var.zone_id
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_112561edc8cc64ee19852b73dd80e824_9" {
  content  = "did=did:plc:mdzvwg64bf734af2aidtlu5e"
  name     = "_atproto.${var.domain}"
  proxied  = false
  tags     = []
  ttl      = 1
  type     = "TXT"
  zone_id  = var.zone_id
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_458370d4d618b05e62ae2bcfc27cc6f4_10" {
  content  = "v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s;"
  name     = "_dmarc.${var.domain}"
  proxied  = false
  tags     = []
  ttl      = 1
  type     = "TXT"
  zone_id  = var.zone_id
  settings = {}
}

resource "cloudflare_dns_record" "terraform_managed_resource_2bd8788cba3256789a404301221d23a2_11" {
  content  = "v=DKIM1; p="
  name     = "*._domainkey.${var.domain}"
  proxied  = false
  tags     = []
  ttl      = 1
  type     = "TXT"
  zone_id  = var.zone_id
  settings = {}
}

