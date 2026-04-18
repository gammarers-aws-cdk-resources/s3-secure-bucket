# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### S3SecureBucket <a name="S3SecureBucket" id="s3-secure-bucket.S3SecureBucket"></a>

An S3 bucket with secure defaults: private access, SSL enforced, public access blocked, and encryption required.

#### Initializers <a name="Initializers" id="s3-secure-bucket.S3SecureBucket.Initializer"></a>

```typescript
import { S3SecureBucket } from 's3-secure-bucket'

new S3SecureBucket(scope: Construct, id: string, props?: S3SecureBucketProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#s3-secure-bucket.S3SecureBucket.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#s3-secure-bucket.S3SecureBucket.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#s3-secure-bucket.S3SecureBucket.Initializer.parameter.props">props</a></code> | <code><a href="#s3-secure-bucket.S3SecureBucketProps">S3SecureBucketProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="s3-secure-bucket.S3SecureBucket.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="s3-secure-bucket.S3SecureBucket.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Optional</sup> <a name="props" id="s3-secure-bucket.S3SecureBucket.Initializer.parameter.props"></a>

- *Type:* <a href="#s3-secure-bucket.S3SecureBucketProps">S3SecureBucketProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#s3-secure-bucket.S3SecureBucket.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.with">with</a></code> | Applies one or more mixins to this construct. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.applyRemovalPolicy">applyRemovalPolicy</a></code> | Apply the given removal policy to this resource. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.addEventNotification">addEventNotification</a></code> | Adds a bucket notification event destination. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.addObjectCreatedNotification">addObjectCreatedNotification</a></code> | Subscribes a destination to receive notifications when an object is created in the bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.addObjectRemovedNotification">addObjectRemovedNotification</a></code> | Subscribes a destination to receive notifications when an object is removed from the bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.addReplicationPolicy">addReplicationPolicy</a></code> | Function to add required permissions to the destination bucket for cross account replication. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.addToResourcePolicy">addToResourcePolicy</a></code> | Adds a statement to the resource policy for a principal (i.e. account/role/service) to perform actions on this bucket and/or its contents. Use `bucketArn` and `arnForObjects(keys)` to obtain ARNs for this bucket or objects. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.arnForObjects">arnForObjects</a></code> | Returns an ARN that represents all objects within the bucket that match the key pattern specified. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.enableEventBridgeNotification">enableEventBridgeNotification</a></code> | Enables event bridge notification, causing all events below to be sent to EventBridge:. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.grantDelete">grantDelete</a></code> | Grants s3:DeleteObject* permission to an IAM principal for objects in this bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.grantOnKey">grantOnKey</a></code> | Gives permissions to a grantable entity to perform actions on the encryption key. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.grantPublicAccess">grantPublicAccess</a></code> | Allows unrestricted access to objects from this bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.grantPut">grantPut</a></code> | Grants s3:PutObject* and s3:Abort* permissions for this bucket to an IAM principal. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.grantPutAcl">grantPutAcl</a></code> | Grant the given IAM identity permissions to modify the ACLs of objects in the given Bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.grantRead">grantRead</a></code> | Grant read permissions for this bucket and it's contents to an IAM principal (Role/Group/User). |
| <code><a href="#s3-secure-bucket.S3SecureBucket.grantReadWrite">grantReadWrite</a></code> | Grants read/write permissions for this bucket and it's contents to an IAM principal (Role/Group/User). |
| <code><a href="#s3-secure-bucket.S3SecureBucket.grantReplicationPermission">grantReplicationPermission</a></code> | Grant replication permission to a principal. This method allows the principal to perform replication operations on this bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.grantWrite">grantWrite</a></code> | Grant write permissions to this bucket to an IAM principal. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.onCloudTrailEvent">onCloudTrailEvent</a></code> | Define a CloudWatch event that triggers when something happens to this repository. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.onCloudTrailPutObject">onCloudTrailPutObject</a></code> | Defines an AWS CloudWatch event that triggers when an object is uploaded to the specified paths (keys) in this bucket using the PutObject API call. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.onCloudTrailWriteObject">onCloudTrailWriteObject</a></code> | Defines an AWS CloudWatch event that triggers when an object at the specified paths (keys) in this bucket are written to. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.s3UrlForObject">s3UrlForObject</a></code> | The S3 URL of an S3 object. For example:. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.transferAccelerationUrlForObject">transferAccelerationUrlForObject</a></code> | The https Transfer Acceleration URL of an S3 object. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.urlForObject">urlForObject</a></code> | The https URL of an S3 object. Specify `regional: false` at the options for non-regional URLs. For example:. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.virtualHostedUrlForObject">virtualHostedUrlForObject</a></code> | The virtual hosted-style URL of an S3 object. Specify `regional: false` at the options for non-regional URL. For example:. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.addCorsRule">addCorsRule</a></code> | Adds a cross-origin access configuration for objects in an Amazon S3 bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.addInventory">addInventory</a></code> | Add an inventory configuration. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.addLifecycleRule">addLifecycleRule</a></code> | Add a lifecycle rule to the bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.addMetric">addMetric</a></code> | Adds a metrics configuration for the CloudWatch request metrics from the bucket. |

---

##### `toString` <a name="toString" id="s3-secure-bucket.S3SecureBucket.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `with` <a name="with" id="s3-secure-bucket.S3SecureBucket.with"></a>

```typescript
public with(mixins: ...IMixin[]): IConstruct
```

Applies one or more mixins to this construct.

Mixins are applied in order. The list of constructs is captured at the
start of the call, so constructs added by a mixin will not be visited.
Use multiple `with()` calls if subsequent mixins should apply to added
constructs.

###### `mixins`<sup>Required</sup> <a name="mixins" id="s3-secure-bucket.S3SecureBucket.with.parameter.mixins"></a>

- *Type:* ...constructs.IMixin[]

The mixins to apply.

---

##### `applyRemovalPolicy` <a name="applyRemovalPolicy" id="s3-secure-bucket.S3SecureBucket.applyRemovalPolicy"></a>

```typescript
public applyRemovalPolicy(policy: RemovalPolicy): void
```

Apply the given removal policy to this resource.

The Removal Policy controls what happens to this resource when it stops
being managed by CloudFormation, either because you've removed it from the
CDK application or because you've made a change that requires the resource
to be replaced.

The resource can be deleted (`RemovalPolicy.DESTROY`), or left in your AWS
account for data recovery and cleanup later (`RemovalPolicy.RETAIN`).

###### `policy`<sup>Required</sup> <a name="policy" id="s3-secure-bucket.S3SecureBucket.applyRemovalPolicy.parameter.policy"></a>

- *Type:* aws-cdk-lib.RemovalPolicy

---

##### `addEventNotification` <a name="addEventNotification" id="s3-secure-bucket.S3SecureBucket.addEventNotification"></a>

```typescript
public addEventNotification(event: EventType, dest: IBucketNotificationDestination, filters: ...NotificationKeyFilter[]): void
```

Adds a bucket notification event destination.

> [https://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html](https://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html)

*Example*

```typescript
   declare const myLambda: lambda.Function;
   const bucket = new s3.Bucket(this, 'MyBucket');
   bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(myLambda), {prefix: 'home/myusername/*'});
```


###### `event`<sup>Required</sup> <a name="event" id="s3-secure-bucket.S3SecureBucket.addEventNotification.parameter.event"></a>

- *Type:* aws-cdk-lib.aws_s3.EventType

The event to trigger the notification.

---

###### `dest`<sup>Required</sup> <a name="dest" id="s3-secure-bucket.S3SecureBucket.addEventNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (Lambda, SNS Topic or SQS Queue).

---

###### `filters`<sup>Required</sup> <a name="filters" id="s3-secure-bucket.S3SecureBucket.addEventNotification.parameter.filters"></a>

- *Type:* ...aws-cdk-lib.aws_s3.NotificationKeyFilter[]

S3 object key filter rules to determine which objects trigger this event.

Each filter must include a `prefix` and/or `suffix`
that will be matched against the s3 object key. Refer to the S3 Developer Guide
for details about allowed filter rules.

---

##### `addObjectCreatedNotification` <a name="addObjectCreatedNotification" id="s3-secure-bucket.S3SecureBucket.addObjectCreatedNotification"></a>

```typescript
public addObjectCreatedNotification(dest: IBucketNotificationDestination, filters: ...NotificationKeyFilter[]): void
```

Subscribes a destination to receive notifications when an object is created in the bucket.

This is identical to calling
`onEvent(EventType.OBJECT_CREATED)`.

###### `dest`<sup>Required</sup> <a name="dest" id="s3-secure-bucket.S3SecureBucket.addObjectCreatedNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (see onEvent).

---

###### `filters`<sup>Required</sup> <a name="filters" id="s3-secure-bucket.S3SecureBucket.addObjectCreatedNotification.parameter.filters"></a>

- *Type:* ...aws-cdk-lib.aws_s3.NotificationKeyFilter[]

Filters (see onEvent).

---

##### `addObjectRemovedNotification` <a name="addObjectRemovedNotification" id="s3-secure-bucket.S3SecureBucket.addObjectRemovedNotification"></a>

```typescript
public addObjectRemovedNotification(dest: IBucketNotificationDestination, filters: ...NotificationKeyFilter[]): void
```

Subscribes a destination to receive notifications when an object is removed from the bucket.

This is identical to calling
`onEvent(EventType.OBJECT_REMOVED)`.

###### `dest`<sup>Required</sup> <a name="dest" id="s3-secure-bucket.S3SecureBucket.addObjectRemovedNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (see onEvent).

---

###### `filters`<sup>Required</sup> <a name="filters" id="s3-secure-bucket.S3SecureBucket.addObjectRemovedNotification.parameter.filters"></a>

- *Type:* ...aws-cdk-lib.aws_s3.NotificationKeyFilter[]

Filters (see onEvent).

---

##### `addReplicationPolicy` <a name="addReplicationPolicy" id="s3-secure-bucket.S3SecureBucket.addReplicationPolicy"></a>

```typescript
public addReplicationPolicy(roleArn: string, accessControlTransition?: boolean, account?: string): void
```

Function to add required permissions to the destination bucket for cross account replication.

These permissions will be added as a resource based policy on the bucket

> [https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-accesscontroltranslation.html](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-accesscontroltranslation.html)

###### `roleArn`<sup>Required</sup> <a name="roleArn" id="s3-secure-bucket.S3SecureBucket.addReplicationPolicy.parameter.roleArn"></a>

- *Type:* string

---

###### `accessControlTransition`<sup>Optional</sup> <a name="accessControlTransition" id="s3-secure-bucket.S3SecureBucket.addReplicationPolicy.parameter.accessControlTransition"></a>

- *Type:* boolean

---

###### `account`<sup>Optional</sup> <a name="account" id="s3-secure-bucket.S3SecureBucket.addReplicationPolicy.parameter.account"></a>

- *Type:* string

---

##### `addToResourcePolicy` <a name="addToResourcePolicy" id="s3-secure-bucket.S3SecureBucket.addToResourcePolicy"></a>

```typescript
public addToResourcePolicy(permission: PolicyStatement): AddToResourcePolicyResult
```

Adds a statement to the resource policy for a principal (i.e. account/role/service) to perform actions on this bucket and/or its contents. Use `bucketArn` and `arnForObjects(keys)` to obtain ARNs for this bucket or objects.

Note that the policy statement may or may not be added to the policy.
For example, when an `IBucket` is created from an existing bucket,
it's not possible to tell whether the bucket already has a policy
attached, let alone to re-use that policy to add more statements to it.
So it's safest to do nothing in these cases.

###### `permission`<sup>Required</sup> <a name="permission" id="s3-secure-bucket.S3SecureBucket.addToResourcePolicy.parameter.permission"></a>

- *Type:* aws-cdk-lib.aws_iam.PolicyStatement

the policy statement to be added to the bucket's policy.

---

##### `arnForObjects` <a name="arnForObjects" id="s3-secure-bucket.S3SecureBucket.arnForObjects"></a>

```typescript
public arnForObjects(keyPattern: string): string
```

Returns an ARN that represents all objects within the bucket that match the key pattern specified.

To represent all keys, specify ``"*"``.

If you need to specify a keyPattern with multiple components, concatenate them into a single string, e.g.:

  arnForObjects(`home/${team}/${user}/*`)

###### `keyPattern`<sup>Required</sup> <a name="keyPattern" id="s3-secure-bucket.S3SecureBucket.arnForObjects.parameter.keyPattern"></a>

- *Type:* string

---

##### `enableEventBridgeNotification` <a name="enableEventBridgeNotification" id="s3-secure-bucket.S3SecureBucket.enableEventBridgeNotification"></a>

```typescript
public enableEventBridgeNotification(): void
```

Enables event bridge notification, causing all events below to be sent to EventBridge:.

Object Deleted (DeleteObject)
- Object Deleted (Lifecycle expiration)
- Object Restore Initiated
- Object Restore Completed
- Object Restore Expired
- Object Storage Class Changed
- Object Access Tier Changed
- Object ACL Updated
- Object Tags Added
- Object Tags Deleted

##### `grantDelete` <a name="grantDelete" id="s3-secure-bucket.S3SecureBucket.grantDelete"></a>

```typescript
public grantDelete(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grants s3:DeleteObject* permission to an IAM principal for objects in this bucket.

###### `identity`<sup>Required</sup> <a name="identity" id="s3-secure-bucket.S3SecureBucket.grantDelete.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="s3-secure-bucket.S3SecureBucket.grantDelete.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

Parameter type is `any` but `string` should be passed in.

---

##### `grantOnKey` <a name="grantOnKey" id="s3-secure-bucket.S3SecureBucket.grantOnKey"></a>

```typescript
public grantOnKey(grantee: IGrantable, actions: ...string[]): GrantOnKeyResult
```

Gives permissions to a grantable entity to perform actions on the encryption key.

###### `grantee`<sup>Required</sup> <a name="grantee" id="s3-secure-bucket.S3SecureBucket.grantOnKey.parameter.grantee"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `actions`<sup>Required</sup> <a name="actions" id="s3-secure-bucket.S3SecureBucket.grantOnKey.parameter.actions"></a>

- *Type:* ...string[]

---

##### `grantPublicAccess` <a name="grantPublicAccess" id="s3-secure-bucket.S3SecureBucket.grantPublicAccess"></a>

```typescript
public grantPublicAccess(allowedActions: ...string[], keyPrefix?: string): Grant
```

Allows unrestricted access to objects from this bucket.

IMPORTANT: This permission allows anyone to perform actions on S3 objects
in this bucket, which is useful for when you configure your bucket as a
website and want everyone to be able to read objects in the bucket without
needing to authenticate.

Without arguments, this method will grant read ("s3:GetObject") access to
all objects ("*") in the bucket.

The method returns the `iam.Grant` object, which can then be modified
as needed. For example, you can add a condition that will restrict access only
to an IPv4 range like this:

    const grant = bucket.grantPublicAccess();
    grant.resourceStatement!.addCondition(‘IpAddress’, { “aws:SourceIp”: “54.240.143.0/24” });

Note that if this `IBucket` refers to an existing bucket, possibly not
managed by CloudFormation, this method will have no effect, since it's
impossible to modify the policy of an existing bucket.

###### `allowedActions`<sup>Required</sup> <a name="allowedActions" id="s3-secure-bucket.S3SecureBucket.grantPublicAccess.parameter.allowedActions"></a>

- *Type:* ...string[]

the set of S3 actions to allow.

Default is "s3:GetObject".

---

###### `keyPrefix`<sup>Optional</sup> <a name="keyPrefix" id="s3-secure-bucket.S3SecureBucket.grantPublicAccess.parameter.keyPrefix"></a>

- *Type:* string

the prefix of S3 object keys (e.g. `home/*`). Default is "*".

---

##### `grantPut` <a name="grantPut" id="s3-secure-bucket.S3SecureBucket.grantPut"></a>

```typescript
public grantPut(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grants s3:PutObject* and s3:Abort* permissions for this bucket to an IAM principal.

If encryption is used, permission to use the key to encrypt the contents
of written files will also be granted to the same principal.

###### `identity`<sup>Required</sup> <a name="identity" id="s3-secure-bucket.S3SecureBucket.grantPut.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="s3-secure-bucket.S3SecureBucket.grantPut.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

Parameter type is `any` but `string` should be passed in.

---

##### `grantPutAcl` <a name="grantPutAcl" id="s3-secure-bucket.S3SecureBucket.grantPutAcl"></a>

```typescript
public grantPutAcl(identity: IGrantable, objectsKeyPattern?: string): Grant
```

Grant the given IAM identity permissions to modify the ACLs of objects in the given Bucket.

If your application has the '@aws-cdk/aws-s3:grantWriteWithoutAcl' feature flag set,
calling `grantWrite` or `grantReadWrite` no longer grants permissions to modify the ACLs of the objects;
in this case, if you need to modify object ACLs, call this method explicitly.

###### `identity`<sup>Required</sup> <a name="identity" id="s3-secure-bucket.S3SecureBucket.grantPutAcl.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="s3-secure-bucket.S3SecureBucket.grantPutAcl.parameter.objectsKeyPattern"></a>

- *Type:* string

---

##### `grantRead` <a name="grantRead" id="s3-secure-bucket.S3SecureBucket.grantRead"></a>

```typescript
public grantRead(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grant read permissions for this bucket and it's contents to an IAM principal (Role/Group/User).

If encryption is used, permission to use the key to decrypt the contents
of the bucket will also be granted to the same principal.

###### `identity`<sup>Required</sup> <a name="identity" id="s3-secure-bucket.S3SecureBucket.grantRead.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="s3-secure-bucket.S3SecureBucket.grantRead.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

Parameter type is `any` but `string` should be passed in.

---

##### `grantReadWrite` <a name="grantReadWrite" id="s3-secure-bucket.S3SecureBucket.grantReadWrite"></a>

```typescript
public grantReadWrite(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grants read/write permissions for this bucket and it's contents to an IAM principal (Role/Group/User).

If an encryption key is used, permission to use the key for
encrypt/decrypt will also be granted.

Before CDK version 1.85.0, this method granted the `s3:PutObject*` permission that included `s3:PutObjectAcl`,
which could be used to grant read/write object access to IAM principals in other accounts.
If you want to get rid of that behavior, update your CDK version to 1.85.0 or later,
and make sure the `@aws-cdk/aws-s3:grantWriteWithoutAcl` feature flag is set to `true`
in the `context` key of your cdk.json file.
If you've already updated, but still need the principal to have permissions to modify the ACLs,
use the `grantPutAcl` method.

###### `identity`<sup>Required</sup> <a name="identity" id="s3-secure-bucket.S3SecureBucket.grantReadWrite.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="s3-secure-bucket.S3SecureBucket.grantReadWrite.parameter.objectsKeyPattern"></a>

- *Type:* any

---

##### `grantReplicationPermission` <a name="grantReplicationPermission" id="s3-secure-bucket.S3SecureBucket.grantReplicationPermission"></a>

```typescript
public grantReplicationPermission(identity: IGrantable, props: GrantReplicationPermissionProps): Grant
```

Grant replication permission to a principal. This method allows the principal to perform replication operations on this bucket.

Note that when calling this function for source or destination buckets that support KMS encryption,
you need to specify the KMS key for encryption and the KMS key for decryption, respectively.

###### `identity`<sup>Required</sup> <a name="identity" id="s3-secure-bucket.S3SecureBucket.grantReplicationPermission.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal to grant replication permission to.

---

###### `props`<sup>Required</sup> <a name="props" id="s3-secure-bucket.S3SecureBucket.grantReplicationPermission.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_s3.GrantReplicationPermissionProps

The properties of the replication source and destination buckets.

---

##### `grantWrite` <a name="grantWrite" id="s3-secure-bucket.S3SecureBucket.grantWrite"></a>

```typescript
public grantWrite(identity: IGrantable, objectsKeyPattern?: any, allowedActionPatterns?: string[]): Grant
```

Grant write permissions to this bucket to an IAM principal.

If encryption is used, permission to use the key to encrypt the contents
of written files will also be granted to the same principal.

Before CDK version 1.85.0, this method granted the `s3:PutObject*` permission that included `s3:PutObjectAcl`,
which could be used to grant read/write object access to IAM principals in other accounts.
If you want to get rid of that behavior, update your CDK version to 1.85.0 or later,
and make sure the `@aws-cdk/aws-s3:grantWriteWithoutAcl` feature flag is set to `true`
in the `context` key of your cdk.json file.
If you've already updated, but still need the principal to have permissions to modify the ACLs,
use the `grantPutAcl` method.

###### `identity`<sup>Required</sup> <a name="identity" id="s3-secure-bucket.S3SecureBucket.grantWrite.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="s3-secure-bucket.S3SecureBucket.grantWrite.parameter.objectsKeyPattern"></a>

- *Type:* any

---

###### `allowedActionPatterns`<sup>Optional</sup> <a name="allowedActionPatterns" id="s3-secure-bucket.S3SecureBucket.grantWrite.parameter.allowedActionPatterns"></a>

- *Type:* string[]

---

##### `onCloudTrailEvent` <a name="onCloudTrailEvent" id="s3-secure-bucket.S3SecureBucket.onCloudTrailEvent"></a>

```typescript
public onCloudTrailEvent(id: string, options?: OnCloudTrailBucketEventOptions): Rule
```

Define a CloudWatch event that triggers when something happens to this repository.

Requires that there exists at least one CloudTrail Trail in your account
that captures the event. This method will not create the Trail.

###### `id`<sup>Required</sup> <a name="id" id="s3-secure-bucket.S3SecureBucket.onCloudTrailEvent.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="s3-secure-bucket.S3SecureBucket.onCloudTrailEvent.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `onCloudTrailPutObject` <a name="onCloudTrailPutObject" id="s3-secure-bucket.S3SecureBucket.onCloudTrailPutObject"></a>

```typescript
public onCloudTrailPutObject(id: string, options?: OnCloudTrailBucketEventOptions): Rule
```

Defines an AWS CloudWatch event that triggers when an object is uploaded to the specified paths (keys) in this bucket using the PutObject API call.

Note that some tools like `aws s3 cp` will automatically use either
PutObject or the multipart upload API depending on the file size,
so using `onCloudTrailWriteObject` may be preferable.

Requires that there exists at least one CloudTrail Trail in your account
that captures the event. This method will not create the Trail.

###### `id`<sup>Required</sup> <a name="id" id="s3-secure-bucket.S3SecureBucket.onCloudTrailPutObject.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="s3-secure-bucket.S3SecureBucket.onCloudTrailPutObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `onCloudTrailWriteObject` <a name="onCloudTrailWriteObject" id="s3-secure-bucket.S3SecureBucket.onCloudTrailWriteObject"></a>

```typescript
public onCloudTrailWriteObject(id: string, options?: OnCloudTrailBucketEventOptions): Rule
```

Defines an AWS CloudWatch event that triggers when an object at the specified paths (keys) in this bucket are written to.

This includes
the events PutObject, CopyObject, and CompleteMultipartUpload.

Note that some tools like `aws s3 cp` will automatically use either
PutObject or the multipart upload API depending on the file size,
so using this method may be preferable to `onCloudTrailPutObject`.

Requires that there exists at least one CloudTrail Trail in your account
that captures the event. This method will not create the Trail.

###### `id`<sup>Required</sup> <a name="id" id="s3-secure-bucket.S3SecureBucket.onCloudTrailWriteObject.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="s3-secure-bucket.S3SecureBucket.onCloudTrailWriteObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `s3UrlForObject` <a name="s3UrlForObject" id="s3-secure-bucket.S3SecureBucket.s3UrlForObject"></a>

```typescript
public s3UrlForObject(key?: string): string
```

The S3 URL of an S3 object. For example:.

`s3://onlybucket`
- `s3://bucket/key`

###### `key`<sup>Optional</sup> <a name="key" id="s3-secure-bucket.S3SecureBucket.s3UrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the S3 URL of the
bucket is returned.

---

##### `transferAccelerationUrlForObject` <a name="transferAccelerationUrlForObject" id="s3-secure-bucket.S3SecureBucket.transferAccelerationUrlForObject"></a>

```typescript
public transferAccelerationUrlForObject(key?: string, options?: TransferAccelerationUrlOptions): string
```

The https Transfer Acceleration URL of an S3 object.

Specify `dualStack: true` at the options
for dual-stack endpoint (connect to the bucket over IPv6). For example:

- `https://bucket.s3-accelerate.amazonaws.com`
- `https://bucket.s3-accelerate.amazonaws.com/key`

###### `key`<sup>Optional</sup> <a name="key" id="s3-secure-bucket.S3SecureBucket.transferAccelerationUrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

###### `options`<sup>Optional</sup> <a name="options" id="s3-secure-bucket.S3SecureBucket.transferAccelerationUrlForObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.TransferAccelerationUrlOptions

Options for generating URL.

---

##### `urlForObject` <a name="urlForObject" id="s3-secure-bucket.S3SecureBucket.urlForObject"></a>

```typescript
public urlForObject(key?: string): string
```

The https URL of an S3 object. Specify `regional: false` at the options for non-regional URLs. For example:.

`https://s3.us-west-1.amazonaws.com/onlybucket`
- `https://s3.us-west-1.amazonaws.com/bucket/key`
- `https://s3.cn-north-1.amazonaws.com.cn/china-bucket/mykey`

###### `key`<sup>Optional</sup> <a name="key" id="s3-secure-bucket.S3SecureBucket.urlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

##### `virtualHostedUrlForObject` <a name="virtualHostedUrlForObject" id="s3-secure-bucket.S3SecureBucket.virtualHostedUrlForObject"></a>

```typescript
public virtualHostedUrlForObject(key?: string, options?: VirtualHostedStyleUrlOptions): string
```

The virtual hosted-style URL of an S3 object. Specify `regional: false` at the options for non-regional URL. For example:.

`https://only-bucket.s3.us-west-1.amazonaws.com`
- `https://bucket.s3.us-west-1.amazonaws.com/key`
- `https://bucket.s3.amazonaws.com/key`
- `https://china-bucket.s3.cn-north-1.amazonaws.com.cn/mykey`

###### `key`<sup>Optional</sup> <a name="key" id="s3-secure-bucket.S3SecureBucket.virtualHostedUrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

###### `options`<sup>Optional</sup> <a name="options" id="s3-secure-bucket.S3SecureBucket.virtualHostedUrlForObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.VirtualHostedStyleUrlOptions

Options for generating URL.

---

##### `addCorsRule` <a name="addCorsRule" id="s3-secure-bucket.S3SecureBucket.addCorsRule"></a>

```typescript
public addCorsRule(rule: CorsRule): void
```

Adds a cross-origin access configuration for objects in an Amazon S3 bucket.

###### `rule`<sup>Required</sup> <a name="rule" id="s3-secure-bucket.S3SecureBucket.addCorsRule.parameter.rule"></a>

- *Type:* aws-cdk-lib.aws_s3.CorsRule

The CORS configuration rule to add.

---

##### `addInventory` <a name="addInventory" id="s3-secure-bucket.S3SecureBucket.addInventory"></a>

```typescript
public addInventory(inventory: Inventory): void
```

Add an inventory configuration.

###### `inventory`<sup>Required</sup> <a name="inventory" id="s3-secure-bucket.S3SecureBucket.addInventory.parameter.inventory"></a>

- *Type:* aws-cdk-lib.aws_s3.Inventory

configuration to add.

---

##### `addLifecycleRule` <a name="addLifecycleRule" id="s3-secure-bucket.S3SecureBucket.addLifecycleRule"></a>

```typescript
public addLifecycleRule(rule: LifecycleRule): void
```

Add a lifecycle rule to the bucket.

###### `rule`<sup>Required</sup> <a name="rule" id="s3-secure-bucket.S3SecureBucket.addLifecycleRule.parameter.rule"></a>

- *Type:* aws-cdk-lib.aws_s3.LifecycleRule

The rule to add.

---

##### `addMetric` <a name="addMetric" id="s3-secure-bucket.S3SecureBucket.addMetric"></a>

```typescript
public addMetric(metric: BucketMetrics): void
```

Adds a metrics configuration for the CloudWatch request metrics from the bucket.

###### `metric`<sup>Required</sup> <a name="metric" id="s3-secure-bucket.S3SecureBucket.addMetric.parameter.metric"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketMetrics

The metric configuration to add.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#s3-secure-bucket.S3SecureBucket.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.isOwnedResource">isOwnedResource</a></code> | Returns true if the construct was created by CDK, and false otherwise. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.isResource">isResource</a></code> | Check whether the given construct is a Resource. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.fromBucketArn">fromBucketArn</a></code> | *No description.* |
| <code><a href="#s3-secure-bucket.S3SecureBucket.fromBucketAttributes">fromBucketAttributes</a></code> | Creates a Bucket construct that represents an external bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.fromBucketName">fromBucketName</a></code> | *No description.* |
| <code><a href="#s3-secure-bucket.S3SecureBucket.fromCfnBucket">fromCfnBucket</a></code> | Create a mutable `IBucket` based on a low-level `CfnBucket`. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.validateBucketName">validateBucketName</a></code> | Thrown an exception if the given bucket name is not valid. |

---

##### `isConstruct` <a name="isConstruct" id="s3-secure-bucket.S3SecureBucket.isConstruct"></a>

```typescript
import { S3SecureBucket } from 's3-secure-bucket'

S3SecureBucket.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="s3-secure-bucket.S3SecureBucket.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `isOwnedResource` <a name="isOwnedResource" id="s3-secure-bucket.S3SecureBucket.isOwnedResource"></a>

```typescript
import { S3SecureBucket } from 's3-secure-bucket'

S3SecureBucket.isOwnedResource(construct: IConstruct)
```

Returns true if the construct was created by CDK, and false otherwise.

###### `construct`<sup>Required</sup> <a name="construct" id="s3-secure-bucket.S3SecureBucket.isOwnedResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `isResource` <a name="isResource" id="s3-secure-bucket.S3SecureBucket.isResource"></a>

```typescript
import { S3SecureBucket } from 's3-secure-bucket'

S3SecureBucket.isResource(construct: IConstruct)
```

Check whether the given construct is a Resource.

###### `construct`<sup>Required</sup> <a name="construct" id="s3-secure-bucket.S3SecureBucket.isResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `fromBucketArn` <a name="fromBucketArn" id="s3-secure-bucket.S3SecureBucket.fromBucketArn"></a>

```typescript
import { S3SecureBucket } from 's3-secure-bucket'

S3SecureBucket.fromBucketArn(scope: Construct, id: string, bucketArn: string)
```

###### `scope`<sup>Required</sup> <a name="scope" id="s3-secure-bucket.S3SecureBucket.fromBucketArn.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="s3-secure-bucket.S3SecureBucket.fromBucketArn.parameter.id"></a>

- *Type:* string

---

###### `bucketArn`<sup>Required</sup> <a name="bucketArn" id="s3-secure-bucket.S3SecureBucket.fromBucketArn.parameter.bucketArn"></a>

- *Type:* string

---

##### `fromBucketAttributes` <a name="fromBucketAttributes" id="s3-secure-bucket.S3SecureBucket.fromBucketAttributes"></a>

```typescript
import { S3SecureBucket } from 's3-secure-bucket'

S3SecureBucket.fromBucketAttributes(scope: Construct, id: string, attrs: BucketAttributes)
```

Creates a Bucket construct that represents an external bucket.

###### `scope`<sup>Required</sup> <a name="scope" id="s3-secure-bucket.S3SecureBucket.fromBucketAttributes.parameter.scope"></a>

- *Type:* constructs.Construct

The parent creating construct (usually `this`).

---

###### `id`<sup>Required</sup> <a name="id" id="s3-secure-bucket.S3SecureBucket.fromBucketAttributes.parameter.id"></a>

- *Type:* string

The construct's name.

---

###### `attrs`<sup>Required</sup> <a name="attrs" id="s3-secure-bucket.S3SecureBucket.fromBucketAttributes.parameter.attrs"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketAttributes

A `BucketAttributes` object.

Can be obtained from a call to
`bucket.export()` or manually created.

---

##### `fromBucketName` <a name="fromBucketName" id="s3-secure-bucket.S3SecureBucket.fromBucketName"></a>

```typescript
import { S3SecureBucket } from 's3-secure-bucket'

S3SecureBucket.fromBucketName(scope: Construct, id: string, bucketName: string)
```

###### `scope`<sup>Required</sup> <a name="scope" id="s3-secure-bucket.S3SecureBucket.fromBucketName.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="s3-secure-bucket.S3SecureBucket.fromBucketName.parameter.id"></a>

- *Type:* string

---

###### `bucketName`<sup>Required</sup> <a name="bucketName" id="s3-secure-bucket.S3SecureBucket.fromBucketName.parameter.bucketName"></a>

- *Type:* string

---

##### `fromCfnBucket` <a name="fromCfnBucket" id="s3-secure-bucket.S3SecureBucket.fromCfnBucket"></a>

```typescript
import { S3SecureBucket } from 's3-secure-bucket'

S3SecureBucket.fromCfnBucket(cfnBucket: CfnBucket)
```

Create a mutable `IBucket` based on a low-level `CfnBucket`.

###### `cfnBucket`<sup>Required</sup> <a name="cfnBucket" id="s3-secure-bucket.S3SecureBucket.fromCfnBucket.parameter.cfnBucket"></a>

- *Type:* aws-cdk-lib.aws_s3.CfnBucket

---

##### `validateBucketName` <a name="validateBucketName" id="s3-secure-bucket.S3SecureBucket.validateBucketName"></a>

```typescript
import { S3SecureBucket } from 's3-secure-bucket'

S3SecureBucket.validateBucketName(physicalName: string, allowLegacyBucketNaming?: boolean)
```

Thrown an exception if the given bucket name is not valid.

###### `physicalName`<sup>Required</sup> <a name="physicalName" id="s3-secure-bucket.S3SecureBucket.validateBucketName.parameter.physicalName"></a>

- *Type:* string

name of the bucket.

---

###### `allowLegacyBucketNaming`<sup>Optional</sup> <a name="allowLegacyBucketNaming" id="s3-secure-bucket.S3SecureBucket.validateBucketName.parameter.allowLegacyBucketNaming"></a>

- *Type:* boolean

allow legacy bucket naming style, default is false.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.env">env</a></code> | <code>aws-cdk-lib.interfaces.ResourceEnvironment</code> | The environment this resource belongs to. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.stack">stack</a></code> | <code>aws-cdk-lib.Stack</code> | The stack in which this resource is defined. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.bucketArn">bucketArn</a></code> | <code>string</code> | The ARN of the bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.bucketDomainName">bucketDomainName</a></code> | <code>string</code> | The IPv4 DNS name of the specified bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.bucketDualStackDomainName">bucketDualStackDomainName</a></code> | <code>string</code> | The IPv6 DNS name of the specified bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.bucketName">bucketName</a></code> | <code>string</code> | The name of the bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.bucketRef">bucketRef</a></code> | <code>aws-cdk-lib.interfaces.aws_s3.BucketReference</code> | A reference to a Bucket resource. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.bucketRegionalDomainName">bucketRegionalDomainName</a></code> | <code>string</code> | The regional domain name of the specified bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.bucketWebsiteDomainName">bucketWebsiteDomainName</a></code> | <code>string</code> | The Domain name of the static website. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.bucketWebsiteUrl">bucketWebsiteUrl</a></code> | <code>string</code> | The URL of the static website. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.encryptionKey">encryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | Optional KMS encryption key associated with this bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.isWebsite">isWebsite</a></code> | <code>boolean</code> | If this bucket has been configured for static website hosting. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.grants">grants</a></code> | <code>aws-cdk-lib.aws_s3.BucketGrants</code> | Collection of grant methods for a Bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.disallowPublicAccess">disallowPublicAccess</a></code> | <code>boolean</code> | Whether to disallow public access. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.policy">policy</a></code> | <code>aws-cdk-lib.aws_s3.BucketPolicy</code> | The resource policy associated with this bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.replicationRoleArn">replicationRoleArn</a></code> | <code>string</code> | Role used to set up permissions on this bucket for replication. |

---

##### `node`<sup>Required</sup> <a name="node" id="s3-secure-bucket.S3SecureBucket.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `env`<sup>Required</sup> <a name="env" id="s3-secure-bucket.S3SecureBucket.property.env"></a>

```typescript
public readonly env: ResourceEnvironment;
```

- *Type:* aws-cdk-lib.interfaces.ResourceEnvironment

The environment this resource belongs to.

For resources that are created and managed in a Stack (those created by
creating new class instances like `new Role()`, `new Bucket()`, etc.), this
is always the same as the environment of the stack they belong to.

For referenced resources (those obtained from referencing methods like
`Role.fromRoleArn()`, `Bucket.fromBucketName()`, etc.), they might be
different than the stack they were imported into.

---

##### `stack`<sup>Required</sup> <a name="stack" id="s3-secure-bucket.S3SecureBucket.property.stack"></a>

```typescript
public readonly stack: Stack;
```

- *Type:* aws-cdk-lib.Stack

The stack in which this resource is defined.

---

##### `bucketArn`<sup>Required</sup> <a name="bucketArn" id="s3-secure-bucket.S3SecureBucket.property.bucketArn"></a>

```typescript
public readonly bucketArn: string;
```

- *Type:* string

The ARN of the bucket.

---

##### `bucketDomainName`<sup>Required</sup> <a name="bucketDomainName" id="s3-secure-bucket.S3SecureBucket.property.bucketDomainName"></a>

```typescript
public readonly bucketDomainName: string;
```

- *Type:* string

The IPv4 DNS name of the specified bucket.

---

##### `bucketDualStackDomainName`<sup>Required</sup> <a name="bucketDualStackDomainName" id="s3-secure-bucket.S3SecureBucket.property.bucketDualStackDomainName"></a>

```typescript
public readonly bucketDualStackDomainName: string;
```

- *Type:* string

The IPv6 DNS name of the specified bucket.

---

##### `bucketName`<sup>Required</sup> <a name="bucketName" id="s3-secure-bucket.S3SecureBucket.property.bucketName"></a>

```typescript
public readonly bucketName: string;
```

- *Type:* string

The name of the bucket.

---

##### `bucketRef`<sup>Required</sup> <a name="bucketRef" id="s3-secure-bucket.S3SecureBucket.property.bucketRef"></a>

```typescript
public readonly bucketRef: BucketReference;
```

- *Type:* aws-cdk-lib.interfaces.aws_s3.BucketReference

A reference to a Bucket resource.

---

##### `bucketRegionalDomainName`<sup>Required</sup> <a name="bucketRegionalDomainName" id="s3-secure-bucket.S3SecureBucket.property.bucketRegionalDomainName"></a>

```typescript
public readonly bucketRegionalDomainName: string;
```

- *Type:* string

The regional domain name of the specified bucket.

---

##### `bucketWebsiteDomainName`<sup>Required</sup> <a name="bucketWebsiteDomainName" id="s3-secure-bucket.S3SecureBucket.property.bucketWebsiteDomainName"></a>

```typescript
public readonly bucketWebsiteDomainName: string;
```

- *Type:* string

The Domain name of the static website.

---

##### `bucketWebsiteUrl`<sup>Required</sup> <a name="bucketWebsiteUrl" id="s3-secure-bucket.S3SecureBucket.property.bucketWebsiteUrl"></a>

```typescript
public readonly bucketWebsiteUrl: string;
```

- *Type:* string

The URL of the static website.

---

##### `encryptionKey`<sup>Optional</sup> <a name="encryptionKey" id="s3-secure-bucket.S3SecureBucket.property.encryptionKey"></a>

```typescript
public readonly encryptionKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey

Optional KMS encryption key associated with this bucket.

---

##### `isWebsite`<sup>Optional</sup> <a name="isWebsite" id="s3-secure-bucket.S3SecureBucket.property.isWebsite"></a>

```typescript
public readonly isWebsite: boolean;
```

- *Type:* boolean

If this bucket has been configured for static website hosting.

---

##### `grants`<sup>Required</sup> <a name="grants" id="s3-secure-bucket.S3SecureBucket.property.grants"></a>

```typescript
public readonly grants: BucketGrants;
```

- *Type:* aws-cdk-lib.aws_s3.BucketGrants

Collection of grant methods for a Bucket.

---

##### `disallowPublicAccess`<sup>Optional</sup> <a name="disallowPublicAccess" id="s3-secure-bucket.S3SecureBucket.property.disallowPublicAccess"></a>

```typescript
public readonly disallowPublicAccess: boolean;
```

- *Type:* boolean

Whether to disallow public access.

---

##### `policy`<sup>Optional</sup> <a name="policy" id="s3-secure-bucket.S3SecureBucket.property.policy"></a>

```typescript
public readonly policy: BucketPolicy;
```

- *Type:* aws-cdk-lib.aws_s3.BucketPolicy

The resource policy associated with this bucket.

If `autoCreatePolicy` is true, a `BucketPolicy` will be created upon the
first call to addToResourcePolicy(s).

---

##### `replicationRoleArn`<sup>Optional</sup> <a name="replicationRoleArn" id="s3-secure-bucket.S3SecureBucket.property.replicationRoleArn"></a>

```typescript
public readonly replicationRoleArn: string;
```

- *Type:* string

Role used to set up permissions on this bucket for replication.

---

#### Constants <a name="Constants" id="Constants"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#s3-secure-bucket.S3SecureBucket.property.PROPERTY_INJECTION_ID">PROPERTY_INJECTION_ID</a></code> | <code>string</code> | Uniquely identifies this class. |

---

##### `PROPERTY_INJECTION_ID`<sup>Required</sup> <a name="PROPERTY_INJECTION_ID" id="s3-secure-bucket.S3SecureBucket.property.PROPERTY_INJECTION_ID"></a>

```typescript
public readonly PROPERTY_INJECTION_ID: string;
```

- *Type:* string

Uniquely identifies this class.

---

## Structs <a name="Structs" id="Structs"></a>

### S3SecureBucketProps <a name="S3SecureBucketProps" id="s3-secure-bucket.S3SecureBucketProps"></a>

Props for {@link S3SecureBucket}.

Extends `s3.BucketProps` with a bucket type for secure defaults.

#### Initializer <a name="Initializer" id="s3-secure-bucket.S3SecureBucketProps.Initializer"></a>

```typescript
import { S3SecureBucketProps } from 's3-secure-bucket'

const s3SecureBucketProps: S3SecureBucketProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.accessControl">accessControl</a></code> | <code>aws-cdk-lib.aws_s3.BucketAccessControl</code> | Specifies a canned ACL that grants predefined permissions to the bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.autoDeleteObjects">autoDeleteObjects</a></code> | <code>boolean</code> | Whether all objects should be automatically deleted when the bucket is removed from the stack or when the stack is deleted. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.blockPublicAccess">blockPublicAccess</a></code> | <code>aws-cdk-lib.aws_s3.BlockPublicAccess</code> | The block public access configuration of this bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.bucketKeyEnabled">bucketKeyEnabled</a></code> | <code>boolean</code> | Whether Amazon S3 should use its own intermediary key to generate data keys. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.bucketName">bucketName</a></code> | <code>string</code> | Physical name of this bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.cors">cors</a></code> | <code>aws-cdk-lib.aws_s3.CorsRule[]</code> | The CORS configuration of this bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.encryption">encryption</a></code> | <code>aws-cdk-lib.aws_s3.BucketEncryption</code> | The kind of server-side encryption to apply to this bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.encryptionKey">encryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | External KMS key to use for bucket encryption. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.enforceSSL">enforceSSL</a></code> | <code>boolean</code> | Enforces SSL for requests. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.eventBridgeEnabled">eventBridgeEnabled</a></code> | <code>boolean</code> | Whether this bucket should send notifications to Amazon EventBridge or not. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.intelligentTieringConfigurations">intelligentTieringConfigurations</a></code> | <code>aws-cdk-lib.aws_s3.IntelligentTieringConfiguration[]</code> | Intelligent Tiering Configurations. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.inventories">inventories</a></code> | <code>aws-cdk-lib.aws_s3.Inventory[]</code> | The inventory configuration of the bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.lifecycleRules">lifecycleRules</a></code> | <code>aws-cdk-lib.aws_s3.LifecycleRule[]</code> | Rules that define how Amazon S3 manages objects during their lifetime. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.metrics">metrics</a></code> | <code>aws-cdk-lib.aws_s3.BucketMetrics[]</code> | The metrics configuration of this bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.minimumTLSVersion">minimumTLSVersion</a></code> | <code>number</code> | Enforces minimum TLS version for requests. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.notificationsHandlerRole">notificationsHandlerRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The role to be used by the notifications handler. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.notificationsSkipDestinationValidation">notificationsSkipDestinationValidation</a></code> | <code>boolean</code> | Skips notification validation of Amazon SQS, Amazon SNS, and Lambda destinations. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.objectLockDefaultRetention">objectLockDefaultRetention</a></code> | <code>aws-cdk-lib.aws_s3.ObjectLockRetention</code> | The default retention mode and rules for S3 Object Lock. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.objectLockEnabled">objectLockEnabled</a></code> | <code>boolean</code> | Enable object lock on the bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.objectOwnership">objectOwnership</a></code> | <code>aws-cdk-lib.aws_s3.ObjectOwnership</code> | The objectOwnership of the bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.publicReadAccess">publicReadAccess</a></code> | <code>boolean</code> | Grants public read access to all objects in the bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | Policy to apply when the bucket is removed from this stack. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.replicationRole">replicationRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The role to be used by the replication. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.replicationRules">replicationRules</a></code> | <code>aws-cdk-lib.aws_s3.ReplicationRule[]</code> | A container for one or more replication rules. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.serverAccessLogsBucket">serverAccessLogsBucket</a></code> | <code>aws-cdk-lib.aws_s3.IBucket</code> | Destination bucket for the server access logs. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.serverAccessLogsPrefix">serverAccessLogsPrefix</a></code> | <code>string</code> | Optional log file prefix to use for the bucket's access logs. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.targetObjectKeyFormat">targetObjectKeyFormat</a></code> | <code>aws-cdk-lib.aws_s3.TargetObjectKeyFormat</code> | Optional key format for log objects. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.transferAcceleration">transferAcceleration</a></code> | <code>boolean</code> | Whether this bucket should have transfer acceleration turned on or not. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.transitionDefaultMinimumObjectSize">transitionDefaultMinimumObjectSize</a></code> | <code>aws-cdk-lib.aws_s3.TransitionDefaultMinimumObjectSize</code> | Indicates which default minimum object size behavior is applied to the lifecycle configuration. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.versioned">versioned</a></code> | <code>boolean</code> | Whether this bucket should have versioning turned on or not. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.websiteErrorDocument">websiteErrorDocument</a></code> | <code>string</code> | The name of the error document (e.g. "404.html") for the website. `websiteIndexDocument` must also be set if this is set. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.websiteIndexDocument">websiteIndexDocument</a></code> | <code>string</code> | The name of the index document (e.g. "index.html") for the website. Enables static website hosting for this bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.websiteRedirect">websiteRedirect</a></code> | <code>aws-cdk-lib.aws_s3.RedirectTarget</code> | Specifies the redirect behavior of all requests to a website endpoint of a bucket. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.websiteRoutingRules">websiteRoutingRules</a></code> | <code>aws-cdk-lib.aws_s3.RoutingRule[]</code> | Rules that define when a redirect is applied and the redirect behavior. |
| <code><a href="#s3-secure-bucket.S3SecureBucketProps.property.bucketType">bucketType</a></code> | <code>string</code> | The type of the bucket. |

---

##### `accessControl`<sup>Optional</sup> <a name="accessControl" id="s3-secure-bucket.S3SecureBucketProps.property.accessControl"></a>

```typescript
public readonly accessControl: BucketAccessControl;
```

- *Type:* aws-cdk-lib.aws_s3.BucketAccessControl
- *Default:* BucketAccessControl.PRIVATE

Specifies a canned ACL that grants predefined permissions to the bucket.

---

##### `autoDeleteObjects`<sup>Optional</sup> <a name="autoDeleteObjects" id="s3-secure-bucket.S3SecureBucketProps.property.autoDeleteObjects"></a>

```typescript
public readonly autoDeleteObjects: boolean;
```

- *Type:* boolean
- *Default:* false

Whether all objects should be automatically deleted when the bucket is removed from the stack or when the stack is deleted.

Requires the `removalPolicy` to be set to `RemovalPolicy.DESTROY`.

**Warning** if you have deployed a bucket with `autoDeleteObjects: true`,
switching this to `false` in a CDK version *before* `1.126.0` will lead to
all objects in the bucket being deleted. Be sure to update your bucket resources
by deploying with CDK version `1.126.0` or later **before** switching this value to `false`.

Setting `autoDeleteObjects` to true on a bucket will add `s3:PutBucketPolicy` to the
bucket policy. This is because during bucket deletion, the custom resource provider
needs to update the bucket policy by adding a deny policy for `s3:PutObject` to
prevent race conditions with external bucket writers.

---

##### `blockPublicAccess`<sup>Optional</sup> <a name="blockPublicAccess" id="s3-secure-bucket.S3SecureBucketProps.property.blockPublicAccess"></a>

```typescript
public readonly blockPublicAccess: BlockPublicAccess;
```

- *Type:* aws-cdk-lib.aws_s3.BlockPublicAccess
- *Default:* CloudFormation defaults will apply. New buckets and objects don't allow public access, but users can modify bucket policies or object permissions to allow public access

The block public access configuration of this bucket.

> [https://docs.aws.amazon.com/AmazonS3/latest/dev/access-control-block-public-access.html](https://docs.aws.amazon.com/AmazonS3/latest/dev/access-control-block-public-access.html)

---

##### `bucketKeyEnabled`<sup>Optional</sup> <a name="bucketKeyEnabled" id="s3-secure-bucket.S3SecureBucketProps.property.bucketKeyEnabled"></a>

```typescript
public readonly bucketKeyEnabled: boolean;
```

- *Type:* boolean
- *Default:* false

Whether Amazon S3 should use its own intermediary key to generate data keys.

Only relevant when using KMS for encryption.

- If not enabled, every object GET and PUT will cause an API call to KMS (with the
  attendant cost implications of that).
- If enabled, S3 will use its own time-limited key instead.

Only relevant, when Encryption is not set to `BucketEncryption.UNENCRYPTED`.

---

##### `bucketName`<sup>Optional</sup> <a name="bucketName" id="s3-secure-bucket.S3SecureBucketProps.property.bucketName"></a>

```typescript
public readonly bucketName: string;
```

- *Type:* string
- *Default:* Assigned by CloudFormation (recommended).

Physical name of this bucket.

---

##### `cors`<sup>Optional</sup> <a name="cors" id="s3-secure-bucket.S3SecureBucketProps.property.cors"></a>

```typescript
public readonly cors: CorsRule[];
```

- *Type:* aws-cdk-lib.aws_s3.CorsRule[]
- *Default:* No CORS configuration.

The CORS configuration of this bucket.

> [https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-cors.html](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-cors.html)

---

##### `encryption`<sup>Optional</sup> <a name="encryption" id="s3-secure-bucket.S3SecureBucketProps.property.encryption"></a>

```typescript
public readonly encryption: BucketEncryption;
```

- *Type:* aws-cdk-lib.aws_s3.BucketEncryption
- *Default:* `KMS` if `encryptionKey` is specified, or `S3_MANAGED` otherwise.

The kind of server-side encryption to apply to this bucket.

If you choose KMS, you can specify a KMS key via `encryptionKey`. If
encryption key is not specified, a key will automatically be created.

---

##### `encryptionKey`<sup>Optional</sup> <a name="encryptionKey" id="s3-secure-bucket.S3SecureBucketProps.property.encryptionKey"></a>

```typescript
public readonly encryptionKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey
- *Default:* If `encryption` is set to `KMS` and this property is undefined, a new KMS key will be created and associated with this bucket.

External KMS key to use for bucket encryption.

The `encryption` property must be either not specified or set to `KMS` or `DSSE`.
An error will be emitted if `encryption` is set to `UNENCRYPTED` or `S3_MANAGED`.

---

##### `enforceSSL`<sup>Optional</sup> <a name="enforceSSL" id="s3-secure-bucket.S3SecureBucketProps.property.enforceSSL"></a>

```typescript
public readonly enforceSSL: boolean;
```

- *Type:* boolean
- *Default:* false

Enforces SSL for requests.

S3.5 of the AWS Foundational Security Best Practices Regarding S3.

> [https://docs.aws.amazon.com/config/latest/developerguide/s3-bucket-ssl-requests-only.html](https://docs.aws.amazon.com/config/latest/developerguide/s3-bucket-ssl-requests-only.html)

---

##### `eventBridgeEnabled`<sup>Optional</sup> <a name="eventBridgeEnabled" id="s3-secure-bucket.S3SecureBucketProps.property.eventBridgeEnabled"></a>

```typescript
public readonly eventBridgeEnabled: boolean;
```

- *Type:* boolean
- *Default:* false

Whether this bucket should send notifications to Amazon EventBridge or not.

---

##### `intelligentTieringConfigurations`<sup>Optional</sup> <a name="intelligentTieringConfigurations" id="s3-secure-bucket.S3SecureBucketProps.property.intelligentTieringConfigurations"></a>

```typescript
public readonly intelligentTieringConfigurations: IntelligentTieringConfiguration[];
```

- *Type:* aws-cdk-lib.aws_s3.IntelligentTieringConfiguration[]
- *Default:* No Intelligent Tiiering Configurations.

Intelligent Tiering Configurations.

> [https://docs.aws.amazon.com/AmazonS3/latest/userguide/intelligent-tiering.html](https://docs.aws.amazon.com/AmazonS3/latest/userguide/intelligent-tiering.html)

---

##### `inventories`<sup>Optional</sup> <a name="inventories" id="s3-secure-bucket.S3SecureBucketProps.property.inventories"></a>

```typescript
public readonly inventories: Inventory[];
```

- *Type:* aws-cdk-lib.aws_s3.Inventory[]
- *Default:* No inventory configuration

The inventory configuration of the bucket.

> [https://docs.aws.amazon.com/AmazonS3/latest/dev/storage-inventory.html](https://docs.aws.amazon.com/AmazonS3/latest/dev/storage-inventory.html)

---

##### `lifecycleRules`<sup>Optional</sup> <a name="lifecycleRules" id="s3-secure-bucket.S3SecureBucketProps.property.lifecycleRules"></a>

```typescript
public readonly lifecycleRules: LifecycleRule[];
```

- *Type:* aws-cdk-lib.aws_s3.LifecycleRule[]
- *Default:* No lifecycle rules.

Rules that define how Amazon S3 manages objects during their lifetime.

---

##### `metrics`<sup>Optional</sup> <a name="metrics" id="s3-secure-bucket.S3SecureBucketProps.property.metrics"></a>

```typescript
public readonly metrics: BucketMetrics[];
```

- *Type:* aws-cdk-lib.aws_s3.BucketMetrics[]
- *Default:* No metrics configuration.

The metrics configuration of this bucket.

> [https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-metricsconfiguration.html](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-metricsconfiguration.html)

---

##### `minimumTLSVersion`<sup>Optional</sup> <a name="minimumTLSVersion" id="s3-secure-bucket.S3SecureBucketProps.property.minimumTLSVersion"></a>

```typescript
public readonly minimumTLSVersion: number;
```

- *Type:* number
- *Default:* No minimum TLS version is enforced.

Enforces minimum TLS version for requests.

Requires `enforceSSL` to be enabled.

> [https://docs.aws.amazon.com/AmazonS3/latest/userguide/amazon-s3-policy-keys.html#example-object-tls-version](https://docs.aws.amazon.com/AmazonS3/latest/userguide/amazon-s3-policy-keys.html#example-object-tls-version)

---

##### `notificationsHandlerRole`<sup>Optional</sup> <a name="notificationsHandlerRole" id="s3-secure-bucket.S3SecureBucketProps.property.notificationsHandlerRole"></a>

```typescript
public readonly notificationsHandlerRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole
- *Default:* a new role will be created.

The role to be used by the notifications handler.

---

##### `notificationsSkipDestinationValidation`<sup>Optional</sup> <a name="notificationsSkipDestinationValidation" id="s3-secure-bucket.S3SecureBucketProps.property.notificationsSkipDestinationValidation"></a>

```typescript
public readonly notificationsSkipDestinationValidation: boolean;
```

- *Type:* boolean
- *Default:* false

Skips notification validation of Amazon SQS, Amazon SNS, and Lambda destinations.

---

##### `objectLockDefaultRetention`<sup>Optional</sup> <a name="objectLockDefaultRetention" id="s3-secure-bucket.S3SecureBucketProps.property.objectLockDefaultRetention"></a>

```typescript
public readonly objectLockDefaultRetention: ObjectLockRetention;
```

- *Type:* aws-cdk-lib.aws_s3.ObjectLockRetention
- *Default:* no default retention period

The default retention mode and rules for S3 Object Lock.

Default retention can be configured after a bucket is created if the bucket already
has object lock enabled. Enabling object lock for existing buckets is not supported.

> [https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock-overview.html#object-lock-bucket-config-enable](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock-overview.html#object-lock-bucket-config-enable)

---

##### `objectLockEnabled`<sup>Optional</sup> <a name="objectLockEnabled" id="s3-secure-bucket.S3SecureBucketProps.property.objectLockEnabled"></a>

```typescript
public readonly objectLockEnabled: boolean;
```

- *Type:* boolean
- *Default:* false, unless objectLockDefaultRetention is set (then, true)

Enable object lock on the bucket.

Enabling object lock for existing buckets is not supported. Object lock must be
enabled when the bucket is created.

> [https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock-overview.html#object-lock-bucket-config-enable](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock-overview.html#object-lock-bucket-config-enable)

---

##### `objectOwnership`<sup>Optional</sup> <a name="objectOwnership" id="s3-secure-bucket.S3SecureBucketProps.property.objectOwnership"></a>

```typescript
public readonly objectOwnership: ObjectOwnership;
```

- *Type:* aws-cdk-lib.aws_s3.ObjectOwnership
- *Default:* No ObjectOwnership configuration. By default, Amazon S3 sets Object Ownership to `Bucket owner enforced`. This means ACLs are disabled and the bucket owner will own every object.

The objectOwnership of the bucket.

> [https://docs.aws.amazon.com/AmazonS3/latest/dev/about-object-ownership.html](https://docs.aws.amazon.com/AmazonS3/latest/dev/about-object-ownership.html)

---

##### `publicReadAccess`<sup>Optional</sup> <a name="publicReadAccess" id="s3-secure-bucket.S3SecureBucketProps.property.publicReadAccess"></a>

```typescript
public readonly publicReadAccess: boolean;
```

- *Type:* boolean
- *Default:* false

Grants public read access to all objects in the bucket.

Similar to calling `bucket.grantPublicAccess()`

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="s3-secure-bucket.S3SecureBucketProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* The bucket will be orphaned.

Policy to apply when the bucket is removed from this stack.

---

##### `replicationRole`<sup>Optional</sup> <a name="replicationRole" id="s3-secure-bucket.S3SecureBucketProps.property.replicationRole"></a>

```typescript
public readonly replicationRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole
- *Default:* a new role will be created.

The role to be used by the replication.

When setting this property, you must also set `replicationRules`.

---

##### `replicationRules`<sup>Optional</sup> <a name="replicationRules" id="s3-secure-bucket.S3SecureBucketProps.property.replicationRules"></a>

```typescript
public readonly replicationRules: ReplicationRule[];
```

- *Type:* aws-cdk-lib.aws_s3.ReplicationRule[]
- *Default:* No replication

A container for one or more replication rules.

---

##### `serverAccessLogsBucket`<sup>Optional</sup> <a name="serverAccessLogsBucket" id="s3-secure-bucket.S3SecureBucketProps.property.serverAccessLogsBucket"></a>

```typescript
public readonly serverAccessLogsBucket: IBucket;
```

- *Type:* aws-cdk-lib.aws_s3.IBucket
- *Default:* If "serverAccessLogsPrefix" undefined - access logs disabled, otherwise - log to current bucket.

Destination bucket for the server access logs.

---

##### `serverAccessLogsPrefix`<sup>Optional</sup> <a name="serverAccessLogsPrefix" id="s3-secure-bucket.S3SecureBucketProps.property.serverAccessLogsPrefix"></a>

```typescript
public readonly serverAccessLogsPrefix: string;
```

- *Type:* string
- *Default:* No log file prefix

Optional log file prefix to use for the bucket's access logs.

If defined without "serverAccessLogsBucket", enables access logs to current bucket with this prefix.

---

##### `targetObjectKeyFormat`<sup>Optional</sup> <a name="targetObjectKeyFormat" id="s3-secure-bucket.S3SecureBucketProps.property.targetObjectKeyFormat"></a>

```typescript
public readonly targetObjectKeyFormat: TargetObjectKeyFormat;
```

- *Type:* aws-cdk-lib.aws_s3.TargetObjectKeyFormat
- *Default:* the default key format is: [DestinationPrefix][YYYY]-[MM]-[DD]-[hh]-[mm]-[ss]-[UniqueString]

Optional key format for log objects.

---

##### `transferAcceleration`<sup>Optional</sup> <a name="transferAcceleration" id="s3-secure-bucket.S3SecureBucketProps.property.transferAcceleration"></a>

```typescript
public readonly transferAcceleration: boolean;
```

- *Type:* boolean
- *Default:* false

Whether this bucket should have transfer acceleration turned on or not.

---

##### `transitionDefaultMinimumObjectSize`<sup>Optional</sup> <a name="transitionDefaultMinimumObjectSize" id="s3-secure-bucket.S3SecureBucketProps.property.transitionDefaultMinimumObjectSize"></a>

```typescript
public readonly transitionDefaultMinimumObjectSize: TransitionDefaultMinimumObjectSize;
```

- *Type:* aws-cdk-lib.aws_s3.TransitionDefaultMinimumObjectSize
- *Default:* TransitionDefaultMinimumObjectSize.VARIES_BY_STORAGE_CLASS before September 2024, otherwise TransitionDefaultMinimumObjectSize.ALL_STORAGE_CLASSES_128_K.

Indicates which default minimum object size behavior is applied to the lifecycle configuration.

To customize the minimum object size for any transition you can add a filter that specifies a custom
`objectSizeGreaterThan` or `objectSizeLessThan` for `lifecycleRules` property. Custom filters always
take precedence over the default transition behavior.

---

##### `versioned`<sup>Optional</sup> <a name="versioned" id="s3-secure-bucket.S3SecureBucketProps.property.versioned"></a>

```typescript
public readonly versioned: boolean;
```

- *Type:* boolean
- *Default:* false (unless object lock is enabled, then true)

Whether this bucket should have versioning turned on or not.

---

##### `websiteErrorDocument`<sup>Optional</sup> <a name="websiteErrorDocument" id="s3-secure-bucket.S3SecureBucketProps.property.websiteErrorDocument"></a>

```typescript
public readonly websiteErrorDocument: string;
```

- *Type:* string
- *Default:* No error document.

The name of the error document (e.g. "404.html") for the website. `websiteIndexDocument` must also be set if this is set.

---

##### `websiteIndexDocument`<sup>Optional</sup> <a name="websiteIndexDocument" id="s3-secure-bucket.S3SecureBucketProps.property.websiteIndexDocument"></a>

```typescript
public readonly websiteIndexDocument: string;
```

- *Type:* string
- *Default:* No index document.

The name of the index document (e.g. "index.html") for the website. Enables static website hosting for this bucket.

---

##### `websiteRedirect`<sup>Optional</sup> <a name="websiteRedirect" id="s3-secure-bucket.S3SecureBucketProps.property.websiteRedirect"></a>

```typescript
public readonly websiteRedirect: RedirectTarget;
```

- *Type:* aws-cdk-lib.aws_s3.RedirectTarget
- *Default:* No redirection.

Specifies the redirect behavior of all requests to a website endpoint of a bucket.

If you specify this property, you can't specify "websiteIndexDocument", "websiteErrorDocument" nor , "websiteRoutingRules".

---

##### `websiteRoutingRules`<sup>Optional</sup> <a name="websiteRoutingRules" id="s3-secure-bucket.S3SecureBucketProps.property.websiteRoutingRules"></a>

```typescript
public readonly websiteRoutingRules: RoutingRule[];
```

- *Type:* aws-cdk-lib.aws_s3.RoutingRule[]
- *Default:* No redirection rules.

Rules that define when a redirect is applied and the redirect behavior.

---

##### `bucketType`<sup>Optional</sup> <a name="bucketType" id="s3-secure-bucket.S3SecureBucketProps.property.bucketType"></a>

```typescript
public readonly bucketType: string;
```

- *Type:* string
- *Default:* S3SecureBucketType.DEFAULT_BUCKET

The type of the bucket.

Determines encryption and resource policy behavior.

---



